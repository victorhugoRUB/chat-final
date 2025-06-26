import { Controller, Post, Body } from '@nestjs/common';
import { CursoService } from '../cursos/curso.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly cursoService: CursoService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('dialogflow')
  async dialogflowWebhook(@Body() body: any) {
    const intent = body.queryResult.intent.displayName;
    const params = body.queryResult.parameters;
    const contexts = body.queryResult.outputContexts || [];

    switch (intent) {
      case 'inicio-aluno':
        return this.handleInicioAluno(params);
        
      case 'continuar-aluno':
        return this.handleValidarAluno(params);

      case 'visualizar-matricula': {
        return this.handleVisualizarMatricula(params, contexts);
      }

      case 'registrar-matricula':
        return this.handleRegistrarMatricula(params, contexts);

      case 'fim-matricula':
        return this.handleFinalizarMatricula(params, contexts);

      default:
        return {
          fulfillmentText: 'Desculpe, não entendi sua solicitação.',
        };
    }
  }

  async handleInicioAluno(params: any) {
    const matricula = params['number'];

    if (!matricula) {
      return {
        fulfillmentText: 'Por favor, informe seu CPF ou matrícula para continuar.',
      };
    }

    const aluno = await this.prisma.aluno.findFirst({
      where: {
          OR: [
            { cpf: matricula },
            { matricula: matricula },
          ],
      },
    });

    if (!aluno) {
      return {
        fulfillmentText: 'Aluno não encontrado. Por favor, verifique seus dados ou contate a secretaria.',
      };
    }

    return {
      fulfillmentText: `Certo insira seu CPF ou número de matrícula (somente número) para continuar.`,
    };
  }

  async handleVisualizarMatricula(params: any, contexts: any[]) {
    let identificador = params['number'];

    // Se não veio diretamente, busca nos contexts
    if (!identificador) {
      for (const ctx of contexts) {
        if (ctx.parameters?.number) {
          identificador = ctx.parameters.number;
          break;
        }
      }
    }

    if (!identificador) {
      return {
        fulfillmentText: 'Identificador não encontrado. Por favor, informe CPF ou matrícula.',
      };
    }

    const dados = await this.cursoService.findMatriculas(identificador.toString());

    if ('mensagem' in dados) {
      return { fulfillmentText: dados.mensagem };
    }

    const cursos = dados.cursos.length > 0
      ? dados.cursos.map((c) => `• ${c}`).join('\n')
      : 'Você ainda não está matriculado em nenhum curso.';

    return {
      fulfillmentText: dados.cursos.length > 0 
        ? `Aqui estão suas matrículas:\n${cursos}\n\nDeseja se matricular em algum outro curso?`
        : `${cursos}\n\nDeseja se matricular em algum curso agora?`,
    };
  }


  async handleValidarAluno(params: any) {
    const identificador = params['number'];

    if (!identificador) {
      return {
        fulfillmentText: `Identificador não informado.`,
      };
    }

    const aluno = await this.prisma.aluno.findFirst({
      where: {
        OR: [
          { cpf: identificador.toString() },
          { matricula: identificador.toString() },
        ],
      },
    });

    if (!aluno) {
      return {
        fulfillmentText: `Aluno com identificador ${identificador} não encontrado.`,
      };
    }

    return {
      fulfillmentText: `Bem-vindo de volta, ${aluno.nome}! Deseja ver suas matrículas ou se matricular?`,
    };
  }

  async handleRegistrarMatricula(params: any, contexts: any[]) {
    const cursosDisponiveis = await this.prisma.curso.findMany({
      select: { nome: true },
    });

    const listaCursos = cursosDisponiveis.length > 0
      ? cursosDisponiveis.map((c) => `• ${c.nome}`).join('\n')
      : 'Nenhum curso disponível no momento.';

    return {
      fulfillmentText:
        `Certo, aqui estão os cursos disponíveis para matrícula:\n${listaCursos}\n\nApenas insira os cursos que deseja se matricular.`,
    };
  }

  async handleFinalizarMatricula(params: any, contexts: any[]) {
    let identificador = params['number'];

    // Busca o número nos contexts se não vier nos params
    if (!identificador) {
      for (const ctx of contexts) {
        if (ctx.parameters?.number) {
          identificador = ctx.parameters.number;
          break;
        }
      }
    }

    if (!identificador) {
      return { fulfillmentText: 'Não foi possível identificar o aluno para registrar a matrícula.' };
    }

    const aluno = await this.prisma.aluno.findFirst({
      where: {
        OR: [
          { cpf: identificador.toString() },
          { matricula: identificador.toString() },
        ],
      },
    });

    if (!aluno) {
      return { fulfillmentText: 'Aluno não encontrado.' };
    }

    const cursosDesejados: string[] = Array.isArray(params['curso']) ? params['curso'] : [params['curso']];

    if (!cursosDesejados || cursosDesejados.length === 0 || !cursosDesejados[0]) {
      return {
        fulfillmentText: 'Por favor, informe o nome do curso que deseja se matricular.',
      };
    }

    const mensagens: string[] = [];

    for (const nomeCurso of cursosDesejados) {
      const curso = await this.prisma.curso.findFirst({
        where: {
          nome: { contains: nomeCurso.replace('curso ', '')},
        },
      });

      if (!curso) {
        mensagens.push(`Curso "${nomeCurso}" não encontrado.`);
        continue;
      }

      const jaMatriculado = await this.prisma.matricula.findFirst({
        where: {
          alunoId: aluno.id,
          cursoId: curso.id,
        },
      });

      if (jaMatriculado) {
        mensagens.push(`Você já está matriculado no curso "${curso.nome}".`);
        continue;
      }

      await this.prisma.matricula.create({
        data: {
          alunoId: aluno.id,
          cursoId: curso.id,
        },
      });

      mensagens.push(`Matrícula realizada com sucesso no curso "${curso.nome}".`);
    }

    return {
      fulfillmentText: mensagens.join('\n'),
    };
  }

}

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

    switch (intent) {
      case 'inicio-aluno':
        return this.handleInicioAluno(params);

      case 'visualizar-matricula':
        return this.handleVisualizarMatricula(params);

      case 'registrar-matricula':
        return this.handleRegistrarMatricula(params);

      default:
        return {
          fulfillmentText: 'Desculpe, não entendi sua solicitação.',
        };
    }
  }

  async handleInicioAluno(params: any) {
    const cpf = params['cpf'];
    const matricula = params['matricula'];

    const aluno = await this.prisma.aluno.upsert({
      where: {
        cpf: cpf ?? '',
      },
      update: {},
      create: {
        nome: 'Aluno',
        cpf: cpf ?? `${Date.now()}-fake`,
        matricula: matricula ?? `${Date.now()}`,
      },
    });

    return {
      fulfillmentText: `Olá ${aluno.nome}, deseja ver suas matrículas ou se matricular em algum curso?`,
    };
  }

  async handleVisualizarMatricula(params: any) {
    const identificador = params['cpf'] ?? params['matricula'];
    const dados = await this.cursoService.findMatriculas(identificador);

    if ('mensagem' in dados) {
      return { fulfillmentText: dados.mensagem };
    }

    const cursos = dados.cursos.length > 0
      ? dados.cursos.map((c) => `• ${c}`).join('\n')
      : 'Você ainda não está matriculado em nenhum curso.';

    return {
      fulfillmentText: `Aqui estão suas matrículas:\n${cursos}\n\nDeseja se matricular em algum outro curso?`,
    };
  }

  async handleRegistrarMatricula(params: any) {
    const cursosDesejados: string[] = Array.isArray(params['curso']) ? params['curso'] : [params['curso']];
    const identificador = params['cpf'] ?? params['matricula'];

    const aluno = await this.prisma.aluno.findFirst({
      where: {
        OR: [
          { cpf: identificador },
          { matricula: identificador },
        ],
      },
    });

    if (!aluno) {
      return { fulfillmentText: 'Aluno não encontrado.' };
    }

    const mensagens: string[] = [];

    for (const nomeCurso of cursosDesejados) {
      const curso = await this.prisma.curso.findFirst({
        where: {
          nome: { contains: nomeCurso },
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

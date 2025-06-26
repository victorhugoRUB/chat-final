import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCursoDto } from './dtos/create-curso.dto';

@Injectable()
export class CursoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCursoDto) {
    return await this.prisma.curso.create({ data: dto });
  }

  async findAll() {
    return await this.prisma.curso.findMany();
  }

  async findMatriculas(identificador: string) {
    const aluno = await this.prisma.aluno.findFirst({
      where: {
        OR: [
          { cpf: identificador },
          { matricula: identificador },
        ],
      },
      include: {
        matriculas: {
          include: {
            curso: true,
          },
        },
      },
    });

    if (!aluno) {
      return { mensagem: 'Aluno não encontrado.' };
    }

    return {
      aluno: aluno.nome,
      cursos: aluno.matriculas.map((m) => m.curso.nome),
    };
  }

  async matricularAluno(params: {
    nome: string;
    cpf: string;
    matricula: string;
    cursoNome: string;
  }) {
    const { nome, cpf, matricula, cursoNome } = params;

    const curso = await this.prisma.curso.findFirst({
      where: { nome: { contains: cursoNome } },
    });

    if (!curso) {
      return { fulfillmentText: `Curso "${cursoNome}" não encontrado.` };
    }

    const aluno = await this.prisma.aluno.upsert({
      where: { cpf },
      update: {},
      create: { nome, cpf, matricula },
    });

    const jaMatriculado = await this.prisma.matricula.findFirst({
      where: { alunoId: aluno.id, cursoId: curso.id },
    });

    if (jaMatriculado) {
      return {
        fulfillmentText: `Você já está matriculado no curso "${curso.nome}".`,
      };
    }

    await this.prisma.matricula.create({
      data: {
        alunoId: aluno.id,
        cursoId: curso.id,
      },
    });

    return {
      fulfillmentText: `Matrícula realizada com sucesso no curso "${curso.nome}".`,
    };
  }
}

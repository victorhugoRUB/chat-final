import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChamadoDto } from './dtos/create-chamado.dto';

@Injectable()
export class ChamadoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateChamadoDto) {
    const tecnico = await this.prisma.tecnico.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!tecnico) {
        throw new Error('Nenhum técnico disponível para atender o chamado');
    }

    const chamado = await this.prisma.chamado.create({
        data: {
            ...data,
            tecnicoId: tecnico.id,
            protocolo: `PROTOCOLO-${Date.now()}`
        },
        include: {
            servico: true,
            usuario: true,
            tecnico: true
        }
    });

    return {
      protocolo: chamado.id,
      status: chamado.status,
      tecnico: chamado.tecnicoId,
      mensagem: 'Chamado registrado com sucesso!',
    };
  }

  async findOne(id: number) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        servico: true,
        usuario: true,
        tecnico: true,
      },
    });

    if (!chamado) {
      return { mensagem: 'Chamado não encontrado' };
    }

    return {
      protocolo: chamado.id,
      status: chamado.status,
      tecnico: chamado.tecnico?.nome,
      descricao: chamado.descricao,
    };
  }
}

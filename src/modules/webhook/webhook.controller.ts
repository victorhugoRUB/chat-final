

import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('dialogflow')
  async dialogflowWebhook(@Body() body: any) {
    const intent = body.queryResult.intent.displayName;
    const parameters = body.queryResult.parameters;

    switch (intent) {
      case 'AbrirChamado':
        return await this.handleAbrirChamado(parameters);

      case 'ContinuarNao':
        return {
          fulfillmentText: 'Perfeito! Me informe seu nome, matrícula, endereço e telefone para finalizar o chamado.',
        };

      case 'InformarDados':
        return await this.handleInformarDados(parameters);

      default:
        return {
          fulfillmentText: 'Desculpe, não entendi. Poderia repetir?',
        };
    }
  }

  async handleAbrirChamado(params: any) {
    const servicoNome = params['servico'];

    const servico = await this.prisma.servico.findFirst({
      where: {
        nome: {
          contains: servicoNome,
        },
      },
    });

    if (!servico) {
      return {
        fulfillmentText: `O serviço ${servicoNome} não foi encontrado.`,
      };
    }

    return {
      fulfillmentText: `O prazo para o serviço ${servico.nome} é de ${servico.prazoAtendimento} minutos. Deseja adicionar mais algum serviço?`,
    };
  }

  async handleInformarDados(params: any) {
    const nome = Array.isArray(params['name']) ? params['name'][0] : params['name'];
    const matricula = params['matricula'];
    const endereco = params['endereco'];
    const telefone = params['telefone'];
    const servicoNome = params['servico'];

    const servico = await this.prisma.servico.findFirst({
      where: {
        nome: {
          contains: servicoNome,
        },
      },
    });

    if (!servico) {
      return {
        fulfillmentText: `O serviço ${servicoNome} não foi encontrado.`,
      };
    }

    const usuario = await this.prisma.usuario.upsert({
      where: { matricula },
      update: {},
      create: {
        nome,
        matricula,
        endereco,
        telefone,
      },
    });

    const tecnicos = await this.prisma.tecnico.findMany();
    const tecnico = tecnicos[Math.floor(Math.random() * tecnicos.length)];

    const protocolo = randomUUID().split('-')[0];

    const chamado = await this.prisma.chamado.create({
      data: {
        protocolo,
        usuarioId: usuario.id,
        servicoId: servico.id,
        tecnicoId: tecnico.id,
        descricao: `Chamado aberto para o serviço ${servico.nome}`,
      },
    });

    return {
      fulfillmentText: `Perfeito ${usuario.nome}, seu chamado foi registrado sob o número ${chamado.protocolo}. Em breve nosso técnico ${tecnico.nome} irá atendê-lo.`,
    };
  }
}

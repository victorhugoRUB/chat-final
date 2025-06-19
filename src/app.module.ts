import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChamadoModule } from './modules/chamados/chamado.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [PrismaModule, WebhookModule, ChamadoModule],
})
export class AppModule {}

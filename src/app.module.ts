import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CursoModule } from './modules/cursos/curso.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [PrismaModule, WebhookModule, CursoModule],
})
export class AppModule {}

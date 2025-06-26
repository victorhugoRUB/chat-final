import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { CursoModule } from '../cursos/curso.module';

@Module({
  imports: [CursoModule],
  controllers: [WebhookController],
})
export class WebhookModule {}

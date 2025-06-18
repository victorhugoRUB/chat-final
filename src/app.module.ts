import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChamadoModule } from './modules/chamados/chamado.module';

@Module({
  imports: [PrismaModule, ChamadoModule],
})
export class AppModule {}

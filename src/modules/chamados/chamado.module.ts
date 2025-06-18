import { Module } from '@nestjs/common';
import { ChamadoService } from './chamado.service';
import { ChamadoController } from './chamado.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ChamadoController],
  providers: [ChamadoService, PrismaService],
  exports: [ChamadoService],
})
export class ChamadoModule {}

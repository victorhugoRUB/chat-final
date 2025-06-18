import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChamadoService } from './chamado.service';
import { CreateChamadoDto } from './dtos/create-chamado.dto';

@Controller('chamados')
export class ChamadoController {
  constructor(private readonly chamadosService: ChamadoService) {}

  @Post()
  create(@Body() createChamadoDto: CreateChamadoDto) {
    return this.chamadosService.create(createChamadoDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chamadosService.findOne(Number(id));
  }
}

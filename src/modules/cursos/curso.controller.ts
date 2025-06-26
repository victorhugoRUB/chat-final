import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CursoService } from './curso.service';
import { CreateCursoDto } from './dtos/create-curso.dto';

@Controller('cursos')
export class CursoController {
  constructor(private readonly cursoService: CursoService) {}

  @Post()
  create(@Body() dto: CreateCursoDto) {
    return this.cursoService.create(dto);
  }

  @Get()
  findAll() {
    return this.cursoService.findAll();
  }

  @Get('matriculas/:identificador')
  findMatriculas(@Param('identificador') identificador: string) {
    return this.cursoService.findMatriculas(identificador);
  }
}

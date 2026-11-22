import { Controller, Get } from '@nestjs/common';
import { CategoriasService } from '../../base/categorias.service';

@Controller('categorias')
export class CategoriasController {
  constructor(private cats: CategoriasService) {}

  // Categorías con sus subcategorías (tabla categories). La usan el inicio, los listados y el registro de negocio
  @Get()
  listar() {
    return this.cats.catalogo();
  }
}

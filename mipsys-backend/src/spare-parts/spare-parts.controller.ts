import {
  Controller,
  Query,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SparePartsService } from './spare-parts.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get()
  async findAll() {
    return await this.sparePartsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.sparePartsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSparePartDto) {
    return await this.sparePartsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSparePartDto
  ) {
    return await this.sparePartsService.update(id, dto);
  }

  @Patch(':id/add-stock')
  async addStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') qty: number
  ) {
    return await this.sparePartsService.addStock(id, qty);
  }
}

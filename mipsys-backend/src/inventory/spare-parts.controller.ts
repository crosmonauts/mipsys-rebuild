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
  DefaultValuePipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return await this.inventoryService.getAll({ search, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.inventoryService.getPartById(id);
  }

  @Post()
  async create(@Body() dto: CreateSparePartDto) {
    return await this.inventoryService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSparePartDto
  ) {
    return await this.inventoryService.update(id, dto);
  }

  @Patch(':id/add-stock')
  async addStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') qty: number
  ) {
    return await this.inventoryService.addStock(id, qty);
  }

  @Patch(':id/reduce-stock')
  async reduceStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') qty: number
  ) {
    return await this.inventoryService.reduceStock(id, qty);
  }

}

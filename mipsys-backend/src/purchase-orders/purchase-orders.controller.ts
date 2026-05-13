import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { UpdatePoStatusDto } from './dto/update-po-status.dto';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  async findAll() {
    return await this.poService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.poService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return await this.poService.create(dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePoStatusDto
  ) {
    return await this.poService.updateStatus(id, dto);
  }

  @Delete(':id')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Query('notes') notes?: string
  ) {
    return await this.poService.cancel(id, notes);
  }
}

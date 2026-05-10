import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { UpdatePoStatusDto } from './dto/update-po-status.dto';
import { PurchaseOrderStatus, PurchaseOrderStatusType } from '../db/schema';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  /** Daftar semua PO, opsional filter by status */
  @Get()
  async findAll(@Query('status') status?: string) {
    if (status && Object.values(PurchaseOrderStatus).includes(status as PurchaseOrderStatusType)) {
      return this.poService.findByStatus(status as PurchaseOrderStatusType);
    }
    return this.poService.findAll();
  }

  /** Detail satu PO */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.poService.findOne(id);
  }

  /** Buat PO baru (status awal: REQUESTED) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(dto);
  }

  /**
   * Update status PO.
   * Alur: REQUESTED → ORDERED → SHIPPED → RECEIVED (stok bertambah)
   * Bisa juga: [status apapun] → CANCELLED
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePoStatusDto,
  ) {
    return this.poService.updateStatus(id, dto);
  }

  /** Shortcut untuk membatalkan PO */
  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes?: string,
  ) {
    return this.poService.cancel(id, notes);
  }
}

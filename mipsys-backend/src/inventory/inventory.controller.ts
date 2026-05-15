import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('parts')
  async getParts(
    @Query('search') search?: string,
    @Query('status') status?: 'ok' | 'low' | 'empty'
  ) {
    return this.inventoryService.getParts({ search, status });
  }

  @Get('parts/search')
  async searchParts(@Query('q') query: string) {
    return this.inventoryService.searchParts(query);
  }

  @Get('parts/:id')
  async getPart(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getPartById(id);
  }

  @Get('parts/:id/movements')
  async getMovements(@Param('id', ParseIntPipe) id: number) {
    return { message: 'Use /stock-movements/part/:id endpoint' };
  }

  @Post('parts/:id/reserve')
  async reserveStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReserveStockDto
  ) {
    return this.inventoryService.reserveStock(
      id,
      dto.quantity,
      dto.srTicketNumber,
      dto.performedBy
    );
  }

  @Get('low-stock-alert')
  async getLowStockAlert() {
    return this.inventoryService.getLowStockAlert();
  }
}

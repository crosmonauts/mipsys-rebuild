import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryReadService } from './inventory-read.service';
import { StockCommandService } from './stock-command.service';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly readService: InventoryReadService,
    private readonly stockCommand: StockCommandService,
    private readonly stockMovementsService: StockMovementsService
  ) {}

  @Get('parts')
  @Roles('ADMIN', 'TECHNICIAN')
  async getParts(
    @Query('search') search?: string,
    @Query('status') status?: 'ok' | 'low' | 'empty'
  ) {
    return this.readService.getParts({ search, status });
  }

  @Get('parts/search')
  @Roles('ADMIN', 'TECHNICIAN')
  async searchParts(
    @Query('q') query: string,
    @Query('srModel') srModel?: string
  ) {
    return this.readService.searchPartsForModel(query, srModel);
  }

  @Get('parts/:id')
  @Roles('ADMIN', 'TECHNICIAN')
  async getPart(@Param('id', ParseIntPipe) id: number) {
    return this.readService.getPartById(id);
  }

  @Get('parts/:id/movements')
  @Roles('ADMIN')
  async getMovements(@Param('id', ParseIntPipe) id: number) {
    return this.stockMovementsService.getMovementsByPart(id);
  }

  @Post('parts/:id/reserve')
  @Roles('ADMIN', 'TECHNICIAN')
  async reserveStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReserveStockDto,
    @CurrentStaffId() staffId: number | null,
  ) {
    return this.stockCommand.reserveStock(
      id,
      dto.quantity,
      dto.srTicketNumber,
      staffId ?? null,
    );
  }

  @Get('models')
  @Roles('ADMIN', 'TECHNICIAN')
  async getModels() {
    return this.readService.getModels();
  }

  @Get('low-stock-alert')
  @Roles('ADMIN')
  async getLowStockAlert() {
    return this.readService.getLowStockAlert();
  }
}

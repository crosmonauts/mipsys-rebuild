import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';

@Module({
  imports: [DatabaseModule, StockMovementsModule],
  controllers: [SparePartsController],
  providers: [SparePartsService],
  exports: [SparePartsService],
})
export class SparePartsModule {}

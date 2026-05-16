import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrderPartsModule } from '../order-parts/order-parts.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [DatabaseModule, OrderPartsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}

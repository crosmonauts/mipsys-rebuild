import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrderPartsController } from './order-parts.controller';
import { OrderPartsService } from './order-parts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderPartsController],
  providers: [OrderPartsService],
  exports: [OrderPartsService],
})
export class OrderPartsModule {}

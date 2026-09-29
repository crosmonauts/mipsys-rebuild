import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReportsController } from './reports.controller';
import { InventoryReportService } from './inventory-report.service';
import { ReceivableReportService } from './receivable-report.service';
import { ServiceReportService } from './service-report.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [
    ServiceReportService,
    InventoryReportService,
    ReceivableReportService,
  ],
  exports: [
    ServiceReportService,
    InventoryReportService,
    ReceivableReportService,
  ],
})
export class ReportsModule {}

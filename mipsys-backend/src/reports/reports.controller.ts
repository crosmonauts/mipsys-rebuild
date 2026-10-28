import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { buildReportFileName } from './report-period';
import { InventoryReportService } from './inventory-report.service';
import { ReceivableReportService } from './receivable-report.service';
import { ServiceReportService } from './service-report.service';
import { ReportPeriodQueryDto } from './dto/report-query.dto';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Export XLSX dibatasi 1 permintaan/menit agar tidak membebani server. */
const EXPORT_THROTTLE = { default: { limit: 1, ttl: 60000 } };

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Roles('SUPER_ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly serviceReport: ServiceReportService,
    private readonly inventoryReport: InventoryReportService,
    private readonly receivableReport: ReceivableReportService,
  ) {}

  @Get('service/summary')
  serviceSummary(@Query() query: ReportPeriodQueryDto) {
    return this.serviceReport.getSummary(query.startDate, query.endDate);
  }

  @Get('service/technicians')
  technicianPerformance(@Query() query: ReportPeriodQueryDto) {
    return this.serviceReport.getTechnicianPerformance(
      query.startDate,
      query.endDate,
    );
  }

  @Get('service/models')
  modelPopularity(@Query() query: ReportPeriodQueryDto) {
    return this.serviceReport.getModelPopularity(
      query.startDate,
      query.endDate,
    );
  }

  @Get('inventory/valuation')
  inventoryValuation() {
    return this.inventoryReport.getValuation();
  }

  @Get('inventory/low-stock')
  inventoryLowStock() {
    return this.inventoryReport.getLowStock();
  }

  @Get('inventory/stock-card/:sparePartId')
  stockCard(
    @Param('sparePartId', ParseIntPipe) sparePartId: number,
    @Query() query: ReportPeriodQueryDto,
  ) {
    return this.inventoryReport.getStockCard(
      sparePartId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('receivable/aging')
  receivableAging(@Query() query: ReportPeriodQueryDto) {
    return this.receivableReport.getAging();
  }

  @Get('export/service-summary')
  @Throttle(EXPORT_THROTTLE)
  async exportServiceSummary(
    @Query() query: ReportPeriodQueryDto,
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.serviceReport.exportSummaryXlsx(
      query.startDate,
      query.endDate,
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('layanan-servis'));
  }

  @Get('export/service-technicians')
  @Throttle(EXPORT_THROTTLE)
  async exportServiceTechnicians(
    @Query() query: ReportPeriodQueryDto,
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.serviceReport.exportTechnicianXlsx(
      query.startDate,
      query.endDate,
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('kinerja-teknisi'));
  }

  @Get('export/service-models')
  @Throttle(EXPORT_THROTTLE)
  async exportServiceModels(
    @Query() query: ReportPeriodQueryDto,
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.serviceReport.exportModelXlsx(
      query.startDate,
      query.endDate,
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('popularitas-model'));
  }

  @Get('export/inventory-valuation')
  @Throttle(EXPORT_THROTTLE)
  async exportInventoryValuation(
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.inventoryReport.exportValuationXlsx(
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('valuasi-persediaan'));
  }

  @Get('export/inventory-low-stock')
  @Throttle(EXPORT_THROTTLE)
  async exportInventoryLowStock(
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.inventoryReport.exportLowStockXlsx(
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('stok-menipis'));
  }

  @Get('export/inventory-stock-card/:sparePartId')
  @Throttle(EXPORT_THROTTLE)
  async exportStockCard(
    @Param('sparePartId', ParseIntPipe) sparePartId: number,
    @Query() query: ReportPeriodQueryDto,
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.inventoryReport.exportStockCardXlsx(
      sparePartId,
      query.startDate,
      query.endDate,
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('kartu-stok'));
  }

  @Get('export/receivable-aging')
  @Throttle(EXPORT_THROTTLE)
  async exportReceivableAging(
    @Res() res: Response,
    @CurrentStaffId() staffId: number | null,
  ) {
    const buffer = await this.receivableReport.exportAgingXlsx(
      undefined,
      this.actor(staffId),
    );
    sendXlsx(res, buffer, buildReportFileName('umur-piutang'));
  }

  /** SUPER_ADMIN tidak punya staffId; aktivitasnya dicatat sebagai sistem. */
  private actor(staffId: number | null): string {
    return staffId === null ? 'Sistem (SUPER_ADMIN)' : `Staff #${staffId}`;
  }
}

function sendXlsx(res: Response, buffer: Buffer, fileName: string): void {
  res.set({
    'Content-Type': XLSX_MIME,
    'Content-Disposition': `attachment; filename="${fileName}"`,
  });
  res.end(buffer);
}

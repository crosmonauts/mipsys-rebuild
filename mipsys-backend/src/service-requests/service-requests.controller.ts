import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ServiceRequestService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';

@Controller('service-request')
export class ServiceRequestsController {
  constructor(private readonly srService: ServiceRequestService) {}

  // --- Dashboard & Stats ---

  @Get('dashboard')
  async getDashboard(
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.srService.getAllDashboard(search, page, limit);
  }

  @Get('stats')
  async getStats() {
    return this.srService.getDashboardStats();
  }

  @Get('activities')
  async getActivities() {
    return this.srService.getLatestActivities();
  }

  @Get('technicians')
  async getTechnicians() {
    return this.srService.findAllTechnicians();
  }

  /**
   * Export seluruh data service request ke file Excel (.xlsx).
   * Endpoint ini harus didefinisikan SEBELUM :ticketNumber agar tidak
   * salah di-parse sebagai ticketNumber dengan nilai "export".
   */
  @Get('export')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.srService.exportToExcel();
    const today = new Date().toISOString().slice(0, 10);
    const filename = `service-requests-${today}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  // --- CRUD ---

  @Get(':ticketNumber')
  async getDetail(@Param('ticketNumber') ticketNumber: string) {
    return this.srService.getDetailByTicketNumber(ticketNumber);
  }

  @Post('entry')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateServiceRequestDto) {
    // TODO: Ganti createDto.adminId dengan user dari JWT Auth Guard
    return this.srService.createEntry(createDto, createDto.adminId);
  }

  @Patch(':ticketNumber/diagnosis')
  async updateTechnician(
    @Param('ticketNumber') ticketNumber: string,
    @Body() updateTechDto: UpdateTechRequestDto,
  ) {
    return this.srService.updateTechDiagnosis(ticketNumber, updateTechDto);
  }
}

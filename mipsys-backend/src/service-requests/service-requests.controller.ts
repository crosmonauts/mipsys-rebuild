import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly srService: ServiceRequestsService) {}

  // 1. Dashboard Resepsionis (GET List dengan Pencarian/Paginasi)
  @Get('dashboard')
  async getDashboard(
    @Query('search') search: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.srService.getReceptionistDashboard(search, parseInt(page), parseInt(limit));
  }

  // 2. Form Entry Baru / Resepsionis (POST)
  @Post('entry')
  async create(@Body() createDto: CreateServiceRequestDto) {
    return await this.srService.createEntry(createDto);
  }

  @Post('sync')
  async syncLegacy() {
    return await this.srService.syncFromLegacy();
  }

  // 3. Update Teknisi & Input Sparepart (PATCH)
  @Patch(':id/technician')
  async updateTechnician(
    @Param('id') id: string, 
    @Body() updateTechDto: UpdateTechRequestDto
  ) {
    return await this.srService.updateTechDiagnosis(id, updateTechDto);
  }

  @Patch(':id/kasir')
  async jalankanKasir(
    @Param('id') id: string,
    @Body() dto: InputBiayaDto
  ) {
    return await this.srService.prosesKasir(id, dto);
  }
}
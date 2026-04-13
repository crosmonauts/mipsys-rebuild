import { Controller, Get, Post } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly srService: ServiceRequestsService) {}

  @Get()
  async getAll() {
    // Memberikan data ke Frontend (React) nanti
    return await this.srService.findAll();
  }

  @Post('sync')
  async sync() {
    // Menjalankan misi siphoning
    return await this.srService.syncFromLegacy();
  }
}
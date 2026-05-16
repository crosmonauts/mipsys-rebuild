import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { ServiceRequestService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { DiagnoseSrDto } from './dto/diagnose-sr.dto';

@Controller('service-request')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get('dashboard')
  async findAll() {
    return await this.serviceRequestService.findAll();
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return await this.serviceRequestService.findOne(id);
  }

  @Get('activities')
  async getActivities() {
    return await this.serviceRequestService.getActivities();
  }

  @Get('stats')
  async getStats() {
    // DoD Performance: Pastikan kueri ini tidak N+1
    return await this.serviceRequestService.getDashboardStats();
  }

  @Post('entry')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createDto: CreateServiceRequestDto) {
    const adminId = 1;

    return await this.serviceRequestService.createEntry(createDto, adminId);
  }

  @Patch(':ticketNumber')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('ticketNumber') ticketNumber: string,
    @Body() updateDto: CreateServiceRequestDto
  ) {
    return await this.serviceRequestService.updateEntry(
      ticketNumber,
      updateDto
    );
  }

  @Post(':ticketNumber/diagnose')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async diagnose(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: DiagnoseSrDto
  ) {
    return this.serviceRequestService.diagnose(ticketNumber, dto);
  }
}

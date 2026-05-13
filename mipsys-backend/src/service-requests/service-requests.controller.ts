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
} from '@nestjs/common';
import { ServiceRequestService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}
  @Post()
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
}

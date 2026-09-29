import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { OrderPartsService } from './order-parts.service';
import { CreateOrderPartDto } from './dto/create-order-part.dto';
import { AddSubstitutePartDto } from './dto/add-substitute-part.dto';

@ApiTags('Order Parts')
@ApiBearerAuth('access-token')
@Controller('order-parts')
export class OrderPartsController {
  constructor(private readonly orderPartsService: OrderPartsService) {}

  @Post()
  @Roles('TECHNICIAN')
  @HttpCode(HttpStatus.CREATED)
  async addPart(@Body() dto: CreateOrderPartDto) {
    return this.orderPartsService.addPart(dto);
  }

  /**
   * Part model lain yang tidak kompatibel: hanya admin yang boleh
   * menyetujuinya, dan alasan wajib diisi agar tercatat.
   */
  @Post('substitute')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async addSubstitutePart(
    @Body() dto: AddSubstitutePartDto,
    @CurrentStaffId() staffId: number | null,
  ) {
    return this.orderPartsService.addSubstitutePart({
      ...dto,
      approvedBy: staffId,
    });
  }

  @Get('sr/:serviceRequestId')
  @Roles('ADMIN', 'TECHNICIAN')
  async getBySR(@Param('serviceRequestId', ParseIntPipe) id: number) {
    return this.orderPartsService.getByServiceRequest(id);
  }

  @Get('sr/:serviceRequestId/total-cost')
  @Roles('ADMIN', 'TECHNICIAN')
  async getTotalCost(@Param('serviceRequestId', ParseIntPipe) id: number) {
    const total = await this.orderPartsService.getTotalPartsCost(id);
    return { serviceRequestId: id, totalPartsCost: total };
  }

  @Delete(':id')
  @Roles('TECHNICIAN', 'ADMIN', 'SUPER_ADMIN')
  async removePart(@Param('id', ParseIntPipe) id: number) {
    return this.orderPartsService.removePart(id);
  }
}

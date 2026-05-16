import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, QueryInvoiceDto } from './dto/create-invoice.dto';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.financeService.findAll(query.search, query.status);
  }

  @Get('invoices/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findOne(id);
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() dto: CreateInvoiceDto) {
    return this.financeService.create(dto);
  }

  @Patch('invoices/:id/pay')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async markAsPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body('method') method: string,
  ) {
    return this.financeService.markAsPaid(id, method);
  }

  @Get('stats')
  async getStats() {
    return this.financeService.getStats();
  }

  @Post('invoices/from-sr/:ticketNumber')
  async generateFromSR(@Param('ticketNumber') ticketNumber: string) {
    return this.financeService.generateFromServiceRequest(ticketNumber);
  }
}

import { Controller, Get, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdatePpnRateDto, UpdateInvoicePrefixDto } from './dto/update-settings.dto';

@Controller('finance/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    return this.settingsService.getAll();
  }

  @Patch('ppn-rate')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updatePpnRate(@Body() dto: UpdatePpnRateDto) {
    return this.settingsService.updatePpnRate(dto.ppnRate);
  }

  @Patch('invoice-prefix')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateInvoicePrefix(@Body() dto: UpdateInvoicePrefixDto) {
    return this.settingsService.updateInvoicePrefix(dto.invoicePrefix);
  }
}

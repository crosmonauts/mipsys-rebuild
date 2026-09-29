import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { MAX_LOGO_BYTES } from '../database/schema/company-profile.schema';
import { CompanyProfileService } from './company-profile.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

/**
 * Identitas legal perusahaan. Hanya SUPER_ADMIN yang boleh mengubah —
 * nilai ini tercetak dikop invoice, surat penawaran, dan semua laporan.
 */
@ApiTags('Company Profile')
@ApiBearerAuth('access-token')
@Controller('company-profile')
export class CompanyProfileController {
  constructor(private readonly service: CompanyProfileService) {}

  @Get()
  @Roles('ADMIN')
  getProfile() {
    return this.service.getProfile();
  }

  @Patch()
  @Roles('SUPER_ADMIN')
  updateProfile(
    @Body() dto: UpdateCompanyProfileDto,
    @CurrentStaffId() staffId: number | null,
  ) {
    return this.service.updateProfile(dto, staffId);
  }

  @Post('logo')
  @Roles('SUPER_ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: MAX_LOGO_BYTES },
    }),
  )
  uploadLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentStaffId() staffId: number | null,
  ) {
    if (!file) {
      throw new BadRequestException('File logo wajib diunggah.');
    }
    return this.service.updateLogo(file.buffer, file.mimetype, staffId);
  }

  @Delete('logo')
  @Roles('SUPER_ADMIN')
  removeLogo() {
    return this.service.removeLogo();
  }

  /** Logo disajikan sebagai berkas; tanpa token agar bisa dipakai <img>. */
  @Get('logo')
  @Roles('ADMIN')
  async serveLogo(@Res() res: Response) {
    const logo = await this.service.getLogo();
    if (!logo) {
      throw new BadRequestException('Logo belum diunggah.');
    }
    res.set({
      'Content-Type': logo.mime,
      'Content-Length': String(logo.data.length),
      'Cache-Control': 'private, max-age=300',
      // Logo hanya dari daftar putih tipe gambar, tapi tetap dikunci CSP
      // agar tidak pernah dieksekusi sebagai skrip.
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    res.end(logo.data);
  }
}

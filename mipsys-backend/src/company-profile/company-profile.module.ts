import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CompanyProfileController],
  providers: [CompanyProfileService],
  exports: [CompanyProfileService],
})
export class CompanyProfileModule {}

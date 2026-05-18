import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoryModelsController } from './category-models.controller';
import { CategoryModelsService } from './category-models.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoryModelsController],
  providers: [CategoryModelsService],
  exports: [CategoryModelsService],
})
export class CategoryModelsModule {}

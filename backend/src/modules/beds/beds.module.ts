import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bed } from './entities/bed.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bed])],
  exports: [TypeOrmModule],
})
export class BedsModule {}

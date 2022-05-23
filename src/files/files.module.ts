import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicFile } from '@app/files/publicFile.entity';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from '@app/files/files.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicFile]), ConfigModule],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/user.entity';
import { UserController } from '@app/user/user.controller';
import { UserService } from '@app/user/user.service';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from '@app/files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule, FilesModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

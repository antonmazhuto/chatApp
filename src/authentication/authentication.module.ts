import { Module } from '@nestjs/common';
import { UserModule } from '@app/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationService } from '@app/authentication/authentication.service';
import { AuthenticationController } from '@app/authentication/authentication.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '@app/authentication/strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@app/authentication/strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: `${configService.get(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          )}s`,
        },
      }),
    }),
  ],
  providers: [AuthenticationService, LocalStrategy, JwtStrategy],
  controllers: [AuthenticationController],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}

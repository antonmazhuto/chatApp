import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticationService } from '@app/authentication/authentication.service';
import { SignUpUserDto } from '@app/authentication/dto/signUp.dto';
import { LocalAuthenticationGuard } from '@app/authentication/guards/localAuthentication.guard';
import { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { JwtAuthenticationGuard } from '@app/authentication/guards/jwtAuthentication.guard';
import { UserService } from '@app/user/user.service';
import { RequestWithUser } from '@app/authentication/types/requestWithUser.interface';
import { JwtRefreshGuard } from '@app/authentication/guards/jwtRefresh.guard';
import { SignInUserDto } from '@app/authentication/dto/signIn.dto';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly userService: UserService,
  ) {}

  @ApiTags('auth')
  @Post('sign-up')
  @UsePipes(new ValidationPipe())
  async signUp(@Body('user') signUpData: SignUpUserDto) {
    return this.authenticationService.signUp(signUpData);
  }

  @ApiTags('auth')
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  // @UseGuards(LocalAuthenticationGuard)
  @Post('sign-in')
  // @UsePipes(new ValidationPipe())
  // async signIn(@Body('user') signInUserDto: SignInUserDto) {
  async signIn(
    @Body('user') signInUserDto: SignInUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.login(signInUserDto);
    return this.userService.buildUserResponse(user);
    // const { user } = request;
    // const accessTokenCookie =
    //   this.authenticationService.getCookieWithJwtAccessToken(user.id);
    // const refreshTokenCookie =
    //   this.authenticationService.getCookieWithJwtRefreshToken(user.id);
    //
    // await this.userService.setCurrentRefreshToken(
    //   refreshTokenCookie.token,
    //   user.id,
    // );
    //
    // request.res.setHeader('Set-Cookie', [
    //   accessTokenCookie,
    //   refreshTokenCookie.token,
    // ]);
    // return user;
  }

  @ApiTags('auth')
  @UseGuards(JwtAuthenticationGuard)
  @Post('log-out')
  @HttpCode(200)
  async logOut(@Req() request: RequestWithUser) {
    await this.userService.removeRefreshToken(request.user.id);
    request.res.setHeader(
      'Set-Cookie',
      this.authenticationService.getCookiesForLogOut(),
    );
  }

  @ApiTags('auth')
  @UseGuards(JwtAuthenticationGuard)
  @Get()
  authenticate(@Req() request: UserResponseInterface) {
    const user = request.user;
    user.password = undefined;
    return user;
  }

  @ApiTags('auth')
  @UseGuards(JwtRefreshGuard)
  @Get('tokens/refresh')
  refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie =
      this.authenticationService.getCookieWithJwtAccessToken(request.user.id);

    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return request.user;
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService } from '@app/authentication/authentication.service';
import { SignUpUserDto } from '@app/authentication/dto/signUp.dto';
import { LocalAuthenticationGuard } from '@app/authentication/guards/localAuthentication.guard';
import { JwtAuthenticationGuard } from '@app/authentication/guards/jwtAuthentication.guard';
import { UserService } from '@app/user/user.service';
import { RequestWithUser } from '@app/authentication/types/requestWithUser.interface';
import { JwtRefreshGuard } from '@app/authentication/guards/jwtRefresh.guard';
import { ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from '@app/authentication/dto/changePassword.dto';

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
  @UseGuards(LocalAuthenticationGuard)
  @Post('sign-in')
  async signIn(@Req() request: RequestWithUser) {
    console.log('request±!!', request);
    const { user } = request;
    console.log('user±!!', user);
    const accessTokenCookie =
      this.authenticationService.getCookieWithJwtAccessToken(user.id);
    const refreshTokenCookie =
      this.authenticationService.getCookieWithJwtRefreshToken(user.id);

    await this.userService.setCurrentRefreshToken(
      refreshTokenCookie.cookie,
      user.id,
    );
    user.password = undefined;
    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie.cookie,
    ]);
    return user;
  }

  @ApiTags('auth')
  @UseGuards(JwtAuthenticationGuard)
  @Post('log-out')
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
  authenticate(@Req() request: RequestWithUser) {
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

  @UseGuards(JwtAuthenticationGuard)
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: RequestWithUser,
  ) {
    return this.userService.changePassword(changePasswordDto, request.user);
  }
}

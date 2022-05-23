import { IsNotEmpty } from 'class-validator';

export class SignInUserDto {
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  readonly password: string;
}

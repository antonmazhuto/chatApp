import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { FilesService } from '@app/files/files.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userByUsername = await this.userRepository.findOne({
      username: createUserDto.username,
    });
    const userByEmail = await this.userRepository.findOne({
      email: createUserDto.email,
    });
    if (userByUsername || userByEmail) {
      throw new HttpException(
        'Email or username are taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    return await this.userRepository.save(newUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
      {
        email: loginUserDto.email,
      },
      { select: ['id', 'username', 'bio', 'password'] },
    );

    if (!user) {
      throw new HttpException(
        'Credentials are note valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordCorrect = await compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new HttpException(
        'Credentials are note valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    delete user.password;

    return user;
  }

  findById(id: number): Promise<UserEntity> {
    const user = this.userRepository.findOne(id);
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);
    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  generateJwt(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
    );
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }

  async addAvatar(userId: number, imageBuffer: Buffer, filename: string) {
    const user = await this.getById(userId);
    if (user.image) {
      await this.userRepository.update(userId, {
        ...user,
        image: null,
      });
      await this.filesService.deletePublicFile(user.image.id);
    }
    const avatar = await this.filesService.uploadPublicFile(
      imageBuffer,
      filename,
    );
    await this.userRepository.update(userId, {
      ...user,
      image: avatar,
    });
    return avatar;
  }

  async deleteAvatar(userId: number) {
    const user = await this.getById(userId);
    const fileId = user.image?.id;
    if (fileId) {
      await this.userRepository.update(userId, {
        ...user,
        image: null,
      });
      await this.filesService.deletePublicFile(fileId);
    }
  }

  // NEw

  async findByEmail(email: string) {
    return await this.userRepository.findOne(
      { email },
      { select: ['id', 'username', 'name', 'bio', 'password'] },
    );
  }

  async getByEmail(email: string) {
    const user = await this.userRepository.findOne({ email });
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this email does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async getById(id: number) {
    const user = await this.userRepository.findOne({ id });
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentHashedRefreshToken = await hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      currentHashedRefreshToken,
    });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.getById(userId);

    const isRefreshTokenMatching = await compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
  }

  async removeRefreshToken(userId: number) {
    return this.userRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }
}

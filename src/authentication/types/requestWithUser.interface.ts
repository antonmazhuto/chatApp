import { Request } from 'express';
import { UserEntity } from '@app/user/user.entity';

export interface RequestWithUser extends Request {
  user: UserEntity;
}

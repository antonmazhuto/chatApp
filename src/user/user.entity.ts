import {
  BeforeInsert,
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { hash } from 'bcrypt';
import { Exclude } from 'class-transformer';
import { PublicFile } from '@app/files/publicFile.entity';
import { ApiProperty } from '@nestjs/swagger';

type Coordinates = {
  lat?: number;
  lon?: number;
};

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  name: string;

  @Column({ default: '' })
  bio: string;

  @JoinColumn()
  @OneToOne(() => PublicFile, {
    eager: true,
    nullable: true,
  })
  image?: PublicFile;

  @Column({ nullable: true })
  lat: string;

  @Column({ nullable: true })
  lon: string;

  @Column({ select: false })
  password: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }

  @Exclude()
  public currentHashedRefreshToken?: string;
}

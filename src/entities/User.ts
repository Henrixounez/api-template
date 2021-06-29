/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Column, CreateDateColumn, Entity, EntitySubscriberInterface, EventSubscriber, InsertEvent, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn, UpdateEvent } from "typeorm";
import * as bcrypt from 'bcrypt';
import * as jwt from "jsonwebtoken";
import * as config from "../config.json";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  password: string;

  @ManyToMany(() => User, relation => relation.friends)
  @JoinTable()
  friends: Array<User>;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  checkPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.password);
  }
  getJWTToken(): string {
    return jwt.sign(
      { userId: this.id, email: this.email },
      config.secret || process.env.JWT_SECRET || "SECRET",
      { expiresIn: "7d" },
    )
  }
}

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  async hashPassword(entity: User): Promise<void> {
    entity.password = await bcrypt.hash(entity.password, 8);
  }

  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    return this.hashPassword(event.entity);
  }

  async beforeUpdate({ entity, databaseEntity }: UpdateEvent<User>): Promise<void> {
    if (entity.password !== databaseEntity?.password) {
      await this.hashPassword(entity);
    }
  }
}

export interface UserReturn {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  friends: Array<UserReturn>;
  createdAt: Date;
  updatedAt: Date;
}

export function formatUserReturn(user: User): UserReturn {
  return {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    friends: user.friends?.map(formatUserReturn),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
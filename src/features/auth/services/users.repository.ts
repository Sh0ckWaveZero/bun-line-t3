import { env } from '~/env.mjs';
import { db } from "~/lib/database/db";

export class UsersRepository {
  expiresIn = 0;
  constructor(

  ) {
    this.expiresIn = Number(env.JWT_EXPIRES_IN);
  }

  async findById(userId: string) {
    try {
      const userPermission: any = await db.account.aggregate({
        where: {
          providerAccountId: {
            contains: userId,
          },
        },
      });
      return userPermission;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async add(user: any) {
    const data = {
      ...user,
      expiresIn: new Date(Date.now() + this.expiresIn),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.user.create({
      data: data,
    });
  }

  async update(user: any) {
    const data = {
      $set: {
        ...user,
        expiresIn: new Date(Date.now() + this.expiresIn),
        updatedAt: new Date(),
      },
    };
    const find = await this.findById(user.userId);
    return db.user.update({
      where: {
        id: find?.id,
      },
      data: data,
    });
  }
}

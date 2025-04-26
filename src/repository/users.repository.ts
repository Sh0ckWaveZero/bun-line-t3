import { env } from '~/env.mjs';
import { prisma } from "~/server/db";

export class UsersRepository {
  expiresIn = 0;
  constructor(

  ) {
    this.expiresIn = Number(env.JWT_EXPIRES_IN);
  }

  async findById(userId: string) {
    try {
      const userPermission: any = await prisma.account.aggregate({
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
    return await prisma.user.create({
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
    return prisma.user.update({
      where: {
        id: find?.id,
      },
      data: data,
    });
  }
}

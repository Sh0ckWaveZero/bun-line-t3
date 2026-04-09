import { Prisma } from "@prisma/client";
import { db } from "@/lib/database/db";

interface UpdateUserInput {
  userId: string;
  email?: string | null;
  emailVerified?: Date | null;
  emailVerifiedFlag?: boolean | null;
  image?: string | null;
  is_verified?: boolean | null;
  name?: string | null;
}

export class UsersRepository {
  async findById(userId: string) {
    try {
      return await db.user.findFirst({
        where: {
          OR: [
            { id: userId },
            {
              accounts: {
                some: {
                  providerAccountId: userId,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error("Failed to find user by identifier", error);
      return null;
    }
  }

  async add(user: Prisma.UserCreateInput) {
    const now = new Date();

    return db.user.create({
      data: {
        ...user,
        createdAt: user.createdAt ?? now,
        updatedAt: now,
      },
    });
  }

  async update(user: UpdateUserInput) {
    const existingUser = await this.findById(user.userId);

    if (!existingUser) {
      return null;
    }

    const { userId: _userId, ...rest } = user;
    const data: Prisma.UserUpdateInput = {
      ...rest,
      updatedAt: new Date(),
    };

    return db.user.update({
      where: {
        id: existingUser.id,
      },
      data,
    });
  }
}

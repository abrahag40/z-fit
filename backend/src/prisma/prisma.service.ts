import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // @ts-ignore: 'beforeExit' no está tipado explícitamente en Prisma 6
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(configService: ConfigService) {
    try {
      const connectionString = configService.get<string>("DATABASE_URL");
      if (!connectionString) {
        throw new Error("DATABASE_URLが設定されていません。");
      }

      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);

      super({ adapter });
      this.pool = pool;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`PrismaServiceの初期化中にエラーが発生しました: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Poolのクローズ中にエラーが発生しました: ${errorMessage}`);
    }
  }
}

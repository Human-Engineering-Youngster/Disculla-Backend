import { Module } from "@nestjs/common";

import { AuthModule } from "./auth.module";
import { PrismaModule } from "./prisma.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

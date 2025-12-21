import { Module } from "@nestjs/common";

import { AuthModule } from "./auth.module";
import { PrismaModule } from "./prisma.module";
import { UserModule } from "./user.module";

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

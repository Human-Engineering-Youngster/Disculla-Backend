import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthGuard } from "./auth/guard/auth.guard";

@Module({
  imports: [ConfigModule],
  providers: [AuthGuard],
  exports: [AuthGuard, ConfigModule],
})
export class AuthModule {}

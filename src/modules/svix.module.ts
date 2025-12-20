import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { VerifySvixSignatureService } from "./svix/application/verify-svix-signature.service";
import { VerifySvix } from "./svix/infrastructure/verify-svix";

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [VerifySvixSignatureService, VerifySvix],
  exports: [VerifySvixSignatureService],
})
export class SvixModule {}

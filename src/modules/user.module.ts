import { Module } from "@nestjs/common";

import { PrismaModule } from "./prisma.module";
import { SvixModule } from "./svix.module";
import { UserService } from "./user/application/user.service";
import { USER_REPOSITORY } from "./user/domain/user.repository.interface";
import { UserRepository } from "./user/infrastructure/user.repository";
import { WebhookUsersController } from "./user/interface/webhook-users.controller";

@Module({
  imports: [PrismaModule, SvixModule],
  controllers: [WebhookUsersController],
  providers: [UserService, { provide: USER_REPOSITORY, useClass: UserRepository }],
})
export class UserModule {}

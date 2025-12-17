import { Module } from "@nestjs/common";

import { PrismaModule } from "./prisma.module";
import { SvixModule } from "./svix.module";
import { SaveUsersService } from "./users/application/save-users.service";
import { USER_REPOSITORY } from "./users/domain/user.repository.interface";
import { UsersRepository } from "./users/infrastructure/users.repository";
import { WebhookUsersController } from "./users/interface/webhook-users.controller";

@Module({
  imports: [PrismaModule, SvixModule],
  controllers: [WebhookUsersController],
  providers: [SaveUsersService, { provide: USER_REPOSITORY, useClass: UsersRepository }],
})
export class UserModule {}

import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Headers,
  RawBodyRequest,
  Req,
  Res,
  Logger,
  HttpStatus,
} from "@nestjs/common";

import { Response } from "express";
import { VerifySvixSignatureService } from "src/modules/svix/application/verify-svix-signature.service";
import { UserService } from "src/modules/user/application/user.service";
import { SaveUserDto, saveUserEventTypes } from "src/modules/user/interface/dto/save-user.dto";
import { UserMapper } from "src/modules/user/interface/mapper/user.mapper";

@Controller("webhooks/clerk/users")
export class WebhookUsersController {
  private readonly logger = new Logger(WebhookUsersController.name);

  constructor(
    private readonly userService: UserService,
    private readonly verifySvixSignatureService: VerifySvixSignatureService
  ) {}

  @Post()
  async save(
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") timestamp: string,
    @Headers("svix-signature") signature: string,
    @Body() saveUserDto: SaveUserDto,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ): Promise<Response> {
    if (!svixId || !timestamp || !signature) {
      const errorMessage = "Missing Svix headers for webhook verification";
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    this.verifySvixSignatureService.execute(req, svixId, timestamp, signature);
    const user = await this.userService.execute(saveUserDto);
    this.logger.log(
      `User saved successfully: ${user.getClerkId().getValue()} (${saveUserDto.type})`
    );

    const statusCode =
      saveUserDto.type === saveUserEventTypes.CREATE ? HttpStatus.CREATED : HttpStatus.OK;

    return res.status(statusCode).json(UserMapper.formatResponse(user));
  }
}

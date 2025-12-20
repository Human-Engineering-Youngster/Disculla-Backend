import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { verifyToken } from "@clerk/backend";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.getToken(request);

    if (!token) {
      const errorMessage = "認証トークンが提供されていません。";
      this.logger.error(errorMessage);
      throw new UnauthorizedException(errorMessage);
    }

    try {
      const secretKey = this.configService.get<string>("CLERK_SECRET_KEY");
      if (!secretKey) {
        throw new Error("CLERK_SECRET_KEY environment variable is not set");
      }

      const payload = await verifyToken(token, {
        secretKey,
      });
      request.clerkId = payload.sub;
    } catch (error) {
      const errorMessage = `トークンの検証に失敗しました`;
      this.logger.error(`${errorMessage}: ${error instanceof Error ? error.stack : String(error)}`);
      throw new UnauthorizedException(`${errorMessage}`);
    }

    return true;
  }

  private getToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    return type === "Bearer" ? token : undefined;
  }
}

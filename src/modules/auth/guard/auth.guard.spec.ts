import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";

import * as clerkBackend from "@clerk/backend";
import { Request } from "express";

import { AuthGuard } from "./auth.guard";

jest.mock("@clerk/backend");

describe("AuthGuard", () => {
  let authGuard: AuthGuard;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "CLERK_SECRET_KEY") {
                return "test-secret-key";
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("should return true when token is valid", async () => {
      const token = "Bearer valid_token";
      const mockRequest = {
        headers: {
          authorization: token,
        },
      } as unknown as Request;

      const mockExecutionContext = {
        switchToHttp: (): { getRequest: () => Request } => ({
          getRequest: (): Request => mockRequest,
        }),
      } as unknown as ExecutionContext;

      (configService.get as jest.Mock).mockReturnValue("test-secret-key");
      (clerkBackend.verifyToken as jest.Mock).mockResolvedValue({
        sub: "user_123",
      });

      const result = await authGuard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.clerkId).toBe("user_123");
      expect(clerkBackend.verifyToken).toHaveBeenCalledWith("valid_token", {
        secretKey: "test-secret-key",
      });
    });

    it("should throw UnauthorizedException when token is missing", async () => {
      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const mockExecutionContext = {
        switchToHttp: (): { getRequest: () => Request } => ({
          getRequest: (): Request => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        "認証トークンが提供されていません。"
      );
    });

    it("should throw UnauthorizedException when Authorization header is not Bearer type", async () => {
      const mockRequest = {
        headers: {
          authorization: "Basic xyz",
        },
      } as unknown as Request;

      const mockExecutionContext = {
        switchToHttp: (): { getRequest: () => Request } => ({
          getRequest: (): Request => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException when token verification fails", async () => {
      const mockRequest = {
        headers: {
          authorization: "Bearer invalid_token",
        },
      } as unknown as Request;

      const mockExecutionContext = {
        switchToHttp: (): { getRequest: () => Request } => ({
          getRequest: (): Request => mockRequest,
        }),
      } as unknown as ExecutionContext;

      (configService.get as jest.Mock).mockReturnValue("test-secret-key");
      (clerkBackend.verifyToken as jest.Mock).mockRejectedValue(
        new InternalServerErrorException("Invalid token")
      );

      await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        "トークンの検証に失敗しました"
      );
    });

    it("should handle malformed Authorization header", async () => {
      const mockRequest = {
        headers: {
          authorization: "MalformedHeader",
        },
      } as unknown as Request;

      const mockExecutionContext = {
        switchToHttp: (): { getRequest: () => Request } => ({
          getRequest: (): Request => mockRequest,
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should extract userId from token payload", async () => {
      const token = "Bearer test_token_123";
      const userId = "user_456";
      const mockRequest = {
        headers: {
          authorization: token,
        },
      } as unknown as Request;

      const mockExecutionContext = {
        switchToHttp: (): { getRequest: () => Request } => ({
          getRequest: (): Request => mockRequest,
        }),
      } as unknown as ExecutionContext;

      (configService.get as jest.Mock).mockReturnValue("test-secret-key");
      (clerkBackend.verifyToken as jest.Mock).mockResolvedValue({
        sub: userId,
      });

      await authGuard.canActivate(mockExecutionContext);

      expect(mockRequest.clerkId).toBe(userId);
    });
  });
});

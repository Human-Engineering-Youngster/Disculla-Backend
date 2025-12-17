import { BadRequestException, HttpStatus, RawBodyRequest } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { Response } from "express";
import { VerifySvixSignatureService } from "src/modules/svix/application/verify-svix-signature.service";
import { UserService } from "src/modules/user/application/user.service";
import { ClerkIdVo } from "src/modules/user/domain/clerk-id.vo";
import { AvatarUrlVo } from "src/modules/user/domain/user-avatar-url.vo";
import { IdVo } from "src/modules/user/domain/user-id.vo";
import { NameVo } from "src/modules/user/domain/user-name.vo";
import { User } from "src/modules/user/domain/user.entity";

import { SaveUserDto, saveUserEventTypes } from "./dto/save-user.dto";
import { WebhookUsersController } from "./webhook-users.controller";

describe("WebhookUsersController", () => {
  let controller: WebhookUsersController;
  let mockUserExecute: jest.Mock;
  let mockVerifySvixExecute: jest.Mock;

  beforeEach(async () => {
    mockUserExecute = jest.fn();
    mockVerifySvixExecute = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookUsersController],
      providers: [
        {
          provide: UserService,
          useValue: {
            execute: mockUserExecute,
          },
        },
        {
          provide: VerifySvixSignatureService,
          useValue: {
            execute: mockVerifySvixExecute,
          },
        },
      ],
    }).compile();

    controller = module.get<WebhookUsersController>(WebhookUsersController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("save", () => {
    const svixId = "test-svix-id";
    const timestamp = "test-timestamp";
    const signature = "test-signature";
    const saveUserDto: SaveUserDto = {
      type: "user.created",
      data: {
        id: "user_123",
        username: "testuser",
        image_url: "http://example.com/avatar.png",
      },
    };
    const req = { rawBody: Buffer.from("test-body") } as RawBodyRequest<Request>;
    const mockStatusFn = jest.fn().mockReturnThis();
    const mockJsonFn = jest.fn().mockReturnThis();
    const mockRes = {
      status: mockStatusFn,
      json: mockJsonFn,
    } as unknown as Response;

    it("should verify signature and save user with 201 status for CREATE event", async () => {
      const expectedUser = User.reconstruct(
        IdVo.of("550e8400-e29b-41d4-a716-446655440000"),
        ClerkIdVo.of("user_123"),
        NameVo.of("testuser"),
        AvatarUrlVo.of("http://example.com/avatar.png")
      );

      mockUserExecute.mockResolvedValue(expectedUser);

      await controller.save(svixId, timestamp, signature, saveUserDto, req, mockRes);

      expect(mockVerifySvixExecute).toHaveBeenCalledWith(req, svixId, timestamp, signature);
      expect(mockUserExecute).toHaveBeenCalledWith(saveUserDto);
      expect(mockStatusFn).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockJsonFn).toHaveBeenCalledWith({
        id: "550e8400-e29b-41d4-a716-446655440000",
        clerkId: "user_123",
        name: "testuser",
        avatarUrl: "http://example.com/avatar.png",
      });
    });

    it("should verify signature and save user with 200 status for UPDATE event", async () => {
      const updateDto: SaveUserDto = {
        type: saveUserEventTypes.UPDATE,
        data: {
          id: "user_123",
          username: "testuser",
          image_url: "http://example.com/avatar.png",
        },
      };

      const expectedUser = User.reconstruct(
        IdVo.of("550e8400-e29b-41d4-a716-446655440000"),
        ClerkIdVo.of("user_123"),
        NameVo.of("testuser"),
        AvatarUrlVo.of("http://example.com/avatar.png")
      );

      mockUserExecute.mockResolvedValue(expectedUser);

      await controller.save(svixId, timestamp, signature, updateDto, req, mockRes);

      expect(mockStatusFn).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockJsonFn).toHaveBeenCalled();
    });

    it("should throw BadRequestException if svix headers are missing", async () => {
      await expect(
        controller.save(
          undefined as unknown as string,
          timestamp,
          signature,
          saveUserDto,
          req,
          mockRes
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.save(
          svixId,
          undefined as unknown as string,
          signature,
          saveUserDto,
          req,
          mockRes
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.save(
          svixId,
          timestamp,
          undefined as unknown as string,
          saveUserDto,
          req,
          mockRes
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});

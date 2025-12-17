import { RawBodyRequest, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { VerifySvix } from "src/modules/svix/infrastructure/verify-svix";
import { WebhookVerificationError } from "svix";

import { VerifySvixSignatureService } from "./verify-svix-signature.service";

describe("VerifySvixSignatureService", () => {
  let service: VerifySvixSignatureService;
  let verifySvix: VerifySvix;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifySvixSignatureService,
        {
          provide: VerifySvix,
          useValue: {
            verifySignature: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VerifySvixSignatureService>(VerifySvixSignatureService);
    verifySvix = module.get<VerifySvix>(VerifySvix);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("execute", () => {
    const svixId = "test-svix-id";
    const timestamp = "test-timestamp";
    const signature = "test-signature";
    const rawBodyContent = "test-body";
    const req = { rawBody: Buffer.from(rawBodyContent) } as RawBodyRequest<Request>;

    it("should verify signature successfully", () => {
      const verifySignatureSpy = jest.spyOn(verifySvix, "verifySignature");
      verifySignatureSpy.mockClear();
      service.execute(req, svixId, timestamp, signature);

      expect(verifySignatureSpy).toHaveBeenCalledWith(rawBodyContent, {
        "svix-id": svixId,
        "svix-timestamp": timestamp,
        "svix-signature": signature,
      });
    });

    it("should throw UnauthorizedException if rawBody is missing", () => {
      const reqWithoutBody = {} as RawBodyRequest<Request>;

      expect(() => service.execute(reqWithoutBody, svixId, timestamp, signature)).toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if verification fails with WebhookVerificationError", () => {
      const error = new WebhookVerificationError("Invalid signature");
      jest.spyOn(verifySvix, "verifySignature").mockImplementation(() => {
        throw error;
      });

      expect(() => service.execute(req, svixId, timestamp, signature)).toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if verification fails with other errors", () => {
      jest.spyOn(verifySvix, "verifySignature").mockImplementation(() => {
        throw new Error("Some other error");
      });

      expect(() => service.execute(req, svixId, timestamp, signature)).toThrow(
        UnauthorizedException
      );
    });
  });
});

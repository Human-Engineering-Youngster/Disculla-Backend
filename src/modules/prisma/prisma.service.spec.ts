import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";

import { PrismaService } from "./prisma.service";

const mockPoolEnd = jest.fn();

jest.mock("pg", () => {
  const actual = jest.requireActual<typeof import("pg")>("pg");
  return {
    ...actual,
    Pool: jest.fn(() => ({
      end: mockPoolEnd,
      on: jest.fn(),
      connect: jest.fn(),
    })),
  };
});

describe("PrismaService", () => {
  let service: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("postgresql://test:test@localhost:5432/test_db"),
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("constructor", () => {
    it("should throw error if DATABASE_URL is not defined", () => {
      jest.spyOn(configService, "get").mockReturnValue(null);

      try {
        new PrismaService(configService);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("DATABASE_URLが設定されていません。");
      }
    });

    it("should initialize with valid DATABASE_URL", () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue("postgresql://test:test@localhost:5432/test_db"),
      } as unknown as ConfigService;

      const prismaService = new PrismaService(mockConfigService);
      expect(prismaService).toBeDefined();
    });
  });

  describe("onModuleInit", () => {
    it("should connect to the database", async () => {
      const connectSpy = jest.spyOn(service, "$connect").mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe("onModuleDestroy", () => {
    it("should end the pool", async () => {
      await service.onModuleDestroy();
      expect(mockPoolEnd).toHaveBeenCalled();
    });
  });
});

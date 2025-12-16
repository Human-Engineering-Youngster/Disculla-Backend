import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaService } from "../src/modules/prisma/prisma.service";
import { PrismaModule } from "../src/modules/prisma.module";

describe("PrismaService (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should be defined", () => {
    expect(prismaService).toBeDefined();
  });

  it("should be able to query the database", async () => {
    const result = await (prismaService as unknown as PrismaClient).$queryRaw<
      Array<{ result: number }>
    >`SELECT 1 as result`;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result[0].result).toBe(1);
  });
});

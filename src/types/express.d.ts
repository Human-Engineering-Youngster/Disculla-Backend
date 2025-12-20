import "express";

declare module "express" {
  export interface Request {
    clerkId?: string;
  }
}

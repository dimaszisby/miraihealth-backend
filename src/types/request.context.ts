import { Request } from "express";
import { UserDomain } from "@/types/domain/user.domain.js";

export type ValidatedBag = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

export type MembershipInfo = {
  id: string;
  role: "owner" | "admin" | "member";
  organizationId: string;
  userId: string;
};

export interface AuthRequest extends Request {
  user?: UserDomain;
  organizationId?: string;
  membership?: MembershipInfo;
}

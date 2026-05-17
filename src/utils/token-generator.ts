import { env } from "../config/envManager.js";
import jwt from "jsonwebtoken";

type TokenSubject = {
  id: string;
  email: string;
  organizationId?: string;
};

export const tokenGenerator = (user: TokenSubject): string => {
  const payload: Record<string, string> = {
    id: user.id,
    email: user.email,
  };
  if (user.organizationId) {
    payload.organizationId = user.organizationId;
  }
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: "7d" });
};

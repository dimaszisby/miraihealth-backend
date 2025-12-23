import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "@/config/envManager.js";
import { TokenPayload, TokenProvider } from "../../application/ports/TokenProvider.js";

export class JwtTokenProvider implements TokenProvider {
  constructor(
    private secret: Secret = env.JWT_SECRET,
    private expiresIn: SignOptions["expiresIn"] = "7d"
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }
}

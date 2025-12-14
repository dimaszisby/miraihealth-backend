import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "@/config/zodEnv";
import { TokenPayload, TokenProvider } from "../../application/ports/TokenProvider";

export class JwtTokenProvider implements TokenProvider {
  constructor(
    private secret: Secret = env.JWT_SECRET,
    private expiresIn: SignOptions["expiresIn"] = "7d"
  ) {}

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }
}

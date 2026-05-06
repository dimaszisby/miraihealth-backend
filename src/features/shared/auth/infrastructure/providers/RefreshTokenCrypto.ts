import crypto from "node:crypto";
import { TokenHasher } from "../../application/ports/TokenHasher.js";

export class RefreshTokenCrypto implements TokenHasher {
  generate(): string {
    return crypto.randomBytes(64).toString("base64url");
  }

  hash(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}

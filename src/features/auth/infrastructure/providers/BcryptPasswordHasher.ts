import bcrypt from "bcrypt";
import { PasswordHasher } from "../../application/ports/PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private rounds = 10) {}

  async hash(raw: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(raw, salt);
  }

  async compare(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }
}

import AppError from "@/utils/AppError";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { PasswordHasher } from "../ports/PasswordHasher";
import { TokenProvider } from "../ports/TokenProvider";
import { AuthUser } from "../../domain/entities/AuthUser";

export type LoginResult = {
  user: AuthUser;
  token: string;
};

export class LoginUser {
  constructor(
    private repo: UserRepository,
    private hasher: PasswordHasher,
    private tokenProvider: TokenProvider
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const normalized = email.trim().toLowerCase();
    const user = await this.repo.findByEmail(normalized);
    if (!user)
      throw new AppError("Invalid email or password", 401);

    const valid = await this.hasher.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password", 401);

    const token = this.tokenProvider.sign({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  }
}

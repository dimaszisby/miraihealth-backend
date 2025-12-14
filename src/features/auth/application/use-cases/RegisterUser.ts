import AppError from "@/utils/AppError";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { PasswordHasher } from "../ports/PasswordHasher";
import { TokenProvider } from "../ports/TokenProvider";
import { AuthUser } from "../../domain/entities/AuthUser";

export type RegisterInput = {
  email: string;
  password: string;
  passwordConfirmation: string;
  username: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

export class RegisterUser {
  constructor(
    private repo: UserRepository,
    private hasher: PasswordHasher,
    private tokenProvider: TokenProvider
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    if (input.password !== input.passwordConfirmation) {
      throw new AppError("Passwords do not match", 400);
    }

    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    if (await this.repo.existsByEmail(email)) {
      throw new AppError("Email already in use", 400);
    }
    if (await this.repo.existsByUsername(username)) {
      throw new AppError("Username already in use", 400);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.repo.create({
      email,
      username,
      passwordHash,
    });

    const token = this.tokenProvider.sign({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  }
}

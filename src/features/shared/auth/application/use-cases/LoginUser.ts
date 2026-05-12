import AppError from "@/utils/AppError.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { MembershipRepository } from "../../domain/repositories/MembershipRepository.js";
import { PasswordHasher } from "../ports/PasswordHasher.js";
import { TokenProvider } from "../ports/TokenProvider.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";
import { IssueRefreshToken } from "./IssueRefreshToken.js";

export type LoginInput = {
  email: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
};

export type LoginResult = {
  user: AuthUser;
  token: string;
  rawRefreshToken: string;
};

export class LoginUser {
  constructor(
    private repo: UserRepository,
    private membershipRepo: MembershipRepository,
    private hasher: PasswordHasher,
    private tokenProvider: TokenProvider,
    private issueRefreshToken: IssueRefreshToken,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const normalized = input.email.trim().toLowerCase();
    const user = await this.repo.findByEmail(normalized);
    if (!user) throw new AppError("Invalid email or password", 401);

    const valid = await this.hasher.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password", 401);

    const membership = await this.membershipRepo.findDefaultByUser(user.id);
    if (!membership) {
      throw new AppError("No active organization membership", 403);
    }

    const token = this.tokenProvider.sign({
      id: user.id,
      email: user.email,
      username: user.username,
      organizationId: membership.organizationId,
    });

    const { rawToken } = await this.issueRefreshToken.execute({
      userId: user.id,
      organizationId: membership.organizationId,
      userAgent: input.userAgent,
      ip: input.ip,
    });

    return { user, token, rawRefreshToken: rawToken };
  }
}

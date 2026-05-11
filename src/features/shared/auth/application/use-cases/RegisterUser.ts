import AppError from "@/utils/AppError.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { OrganizationRepository } from "../../domain/repositories/OrganizationRepository.js";
import { MembershipRepository } from "../../domain/repositories/MembershipRepository.js";
import { PasswordHasher } from "../ports/PasswordHasher.js";
import { TokenProvider } from "../ports/TokenProvider.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";

export type RegisterInput = {
  email: string;
  password: string;
  passwordConfirmation: string;
  username: string;
  isPublicProfile?: boolean;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

export class RegisterUser {
  constructor(
    private repo: UserRepository,
    private orgRepo: OrganizationRepository,
    private membershipRepo: MembershipRepository,
    private hasher: PasswordHasher,
    private tokenProvider: TokenProvider,
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    if (input.password !== input.passwordConfirmation) {
      throw new AppError("Passwords do not match", 400);
    }

    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    if (await this.repo.existsByEmail(email)) {
      throw new AppError("Email already in use", 409);
    }
    if (await this.repo.existsByUsername(username)) {
      throw new AppError("Username already in use", 409);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const isPublicProfile = input.isPublicProfile ?? true;
    const user = await this.repo.create({
      email,
      username,
      passwordHash,
      isPublicProfile,
    });

    const slugPrefix = username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 91);
    const slug = slugPrefix + "-" + user.id.slice(0, 8);
    const org = await this.orgRepo.create({ name: username, slug });
    await this.membershipRepo.create({
      userId: user.id,
      organizationId: org.id,
      role: "owner",
    });

    const token = this.tokenProvider.sign({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  }
}

import { env } from "@/config/envManager.js";
import { UserRepositorySequelize } from "./infrastructure/persistence/UserRepositorySequelize.js";
import { PasswordResetTokenRepositorySequelize } from "./infrastructure/persistence/PasswordResetTokenRepositorySequelize.js";
import { BcryptPasswordHasher } from "./infrastructure/providers/BcryptPasswordHasher.js";
import { JwtTokenProvider } from "./infrastructure/providers/JwtTokenProvider.js";
import { ConsoleEmailSender } from "./infrastructure/providers/ConsoleEmailSender.js";
import { ResendEmailSender } from "./infrastructure/providers/ResendEmailSender.js";
import { EmailSender } from "./application/ports/EmailSender.js";
import { RegisterUser } from "./application/use-cases/RegisterUser.js";
import { LoginUser } from "./application/use-cases/LoginUser.js";
import { GetProfile } from "./application/queries/GetProfile.js";
import { UpdateProfile } from "./application/use-cases/UpdateProfile.js";
import { RequestPasswordReset } from "./application/use-cases/RequestPasswordReset.js";
import { ResetPassword } from "./application/use-cases/ResetPassword.js";

const buildEmailSender = (): EmailSender => {
  if (env.EMAIL_PROVIDER === "resend") {
    if (!env.RESEND_API_KEY) {
      throw new Error(
        "EMAIL_PROVIDER=resend requires RESEND_API_KEY to be set.",
      );
    }
    return new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM);
  }
  return new ConsoleEmailSender();
};

export type AuthFeatureOverrides = {
  emailSender?: EmailSender;
};

export const buildAuthFeature = (overrides: AuthFeatureOverrides = {}) => {
  const repo = new UserRepositorySequelize();
  const resetTokenRepo = new PasswordResetTokenRepositorySequelize();
  const hasher = new BcryptPasswordHasher();
  const token = new JwtTokenProvider();
  const emailSender = overrides.emailSender ?? buildEmailSender();

  return {
    registerUser: new RegisterUser(repo, hasher, token),
    loginUser: new LoginUser(repo, hasher, token),
    getProfile: new GetProfile(repo),
    updateProfile: new UpdateProfile(repo, hasher),
    requestPasswordReset: new RequestPasswordReset(
      repo,
      resetTokenRepo,
      emailSender,
      { frontendResetUrl: env.FRONTEND_RESET_URL },
    ),
    resetPassword: new ResetPassword(repo, resetTokenRepo, hasher),
  };
};

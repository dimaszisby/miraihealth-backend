import { UserRepositorySequelize } from "./infrastructure/persistence/UserRepositorySequelize.js";
import { BcryptPasswordHasher } from "./infrastructure/providers/BcryptPasswordHasher.js";
import { JwtTokenProvider } from "./infrastructure/providers/JwtTokenProvider.js";
import { RegisterUser } from "./application/use-cases/RegisterUser.js";
import { LoginUser } from "./application/use-cases/LoginUser.js";
import { GetProfile } from "./application/queries/GetProfile.js";
import { UpdateProfile } from "./application/use-cases/UpdateProfile.js";

export const buildAuthFeature = () => {
  const repo = new UserRepositorySequelize();
  const hasher = new BcryptPasswordHasher();
  const token = new JwtTokenProvider();

  return {
    registerUser: new RegisterUser(repo, hasher, token),
    loginUser: new LoginUser(repo, hasher, token),
    getProfile: new GetProfile(repo),
    updateProfile: new UpdateProfile(repo, hasher),
  };
};

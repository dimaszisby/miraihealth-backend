import { UserRepositorySequelize } from "./infrastructure/persistence/UserRepositorySequelize";
import { BcryptPasswordHasher } from "./infrastructure/providers/BcryptPasswordHasher";
import { JwtTokenProvider } from "./infrastructure/providers/JwtTokenProvider";
import { RegisterUser } from "./application/use-cases/RegisterUser";
import { LoginUser } from "./application/use-cases/LoginUser";
import { GetProfile } from "./application/queries/GetProfile";
import { UpdateProfile } from "./application/use-cases/UpdateProfile";

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

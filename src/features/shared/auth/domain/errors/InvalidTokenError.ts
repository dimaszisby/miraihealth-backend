import AppError from "@/utils/AppError.js";

export class InvalidTokenError extends AppError {
  constructor(message = "Unauthorized: Invalid token") {
    super(message, 401);
  }
}

import { CustomError } from "./CustomError";
import { ErrorDetails } from "./ErrorDetails";
export class RedisError extends CustomError {
  constructor(message: string, originalError: unknown, details?: ErrorDetails) {
    super(message, 502, originalError, details);
  }
}

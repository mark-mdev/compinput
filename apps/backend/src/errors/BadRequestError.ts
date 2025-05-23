import { ZodIssue } from "zod";
import { CustomError } from "./CustomError";

export class BadRequestError extends CustomError {
  errors?: ZodIssue[];

  constructor(message: string, errors?: ZodIssue[]) {
    super(message, 400, null);
    this.errors = errors;
  }
}

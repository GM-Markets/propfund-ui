/**
 * Errors thrown by service functions. `message` is user-facing copy; `code`
 * is stable for branching in the UI.
 */

export type ServiceErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_READY"
  | "NOT_FOUND"
  | "VALIDATION"
  | "BARRED"
  | "RESTRICTED_REGION"
  | "ACTIVE_ACCOUNT_EXISTS"
  | "TERMS_NOT_ACCEPTED"
  | "CREDIT_COVERS_FEE"
  | "CREDIT_INSUFFICIENT"
  | "INSUFFICIENT_WALLET_BALANCE"
  | "INVALID_STATE"
  | "NO_ACTIVE_ACCOUNT"
  | "ACCOUNT_READ_ONLY"
  | "INSUFFICIENT_MARGIN"
  | "KYC_NOT_REQUIRED"
  | "PAYOUT_BLOCKED";

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  /** Extra machine-readable detail (e.g. payout blockers). */
  readonly details?: unknown;

  constructor(code: ServiceErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.details = details;
  }
}

export function isServiceError(e: unknown): e is ServiceError {
  return e instanceof ServiceError;
}

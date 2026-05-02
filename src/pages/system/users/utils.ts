import { isApiError } from "@/lib/api-error";
import type { UserRecord } from "@/types";

export function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getRoleNames(user: UserRecord) {
  if (!user.roles?.length) return "-";
  return user.roles.map((role) => role.roleName).join("、");
}

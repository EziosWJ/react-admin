import { mockLogin } from "@/mocks/auth";
import type { AuthUser, LoginRequest } from "@/types";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function loginByPassword(
  request: LoginRequest,
): Promise<AuthUser | null> {
  await wait(300);
  return mockLogin(request);
}

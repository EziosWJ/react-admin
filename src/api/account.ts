import { mockGetAccountProfile } from "@/mocks/account";
import type { AccountProfile } from "@/types";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function getAccountProfile(): Promise<AccountProfile> {
  await wait(300);
  return mockGetAccountProfile();
}


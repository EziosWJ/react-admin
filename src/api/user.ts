import { filterMockUsers, mockUsers } from "@/mocks/users";
import type { UserListQuery, UserRecord } from "@/types";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function getUserList(
  query: UserListQuery = {},
): Promise<UserRecord[]> {
  await wait(300);
  return filterMockUsers(query);
}

export function getUserTotal() {
  return mockUsers.length;
}

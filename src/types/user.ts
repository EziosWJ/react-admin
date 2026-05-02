export type UserStatus = "active" | "pending" | "disabled";

export type UserRecord = {
  id: number;
  name: string;
  account: string;
  role: string;
  department: string;
  status: UserStatus;
  lastLogin: string;
};

export type UserListQuery = {
  keyword?: string;
  status?: UserStatus | "all";
};


export type SystemStatus = "enabled" | "disabled";

export type DictTypeRecord = {
  id: number;
  name: string;
  code: string;
  status: SystemStatus;
  itemCount: number;
  updatedAt: string;
};

export type DictItemRecord = {
  id: number;
  typeCode: string;
  label: string;
  value: string;
  sort: number;
  status: SystemStatus;
  updatedAt: string;
};

export type DictQuery = {
  keyword?: string;
  status?: SystemStatus | "all";
};

export type ConfigType = "string" | "number" | "boolean" | "json";

export type SystemConfigRecord = {
  id: number;
  name: string;
  key: string;
  value: string;
  type: ConfigType;
  status: SystemStatus;
  updatedAt: string;
};

export type ConfigQuery = {
  keyword?: string;
  type?: ConfigType | "all";
  status?: SystemStatus | "all";
};


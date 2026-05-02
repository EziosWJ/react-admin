import {
  filterMockDictItems,
  filterMockDictTypes,
  filterMockSystemConfigs,
  mockDictTypes,
  mockSystemConfigs,
} from "@/mocks/system";
import type {
  ConfigQuery,
  DictItemRecord,
  DictQuery,
  DictTypeRecord,
  SystemConfigRecord,
} from "@/types";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function getDictTypes(
  query: DictQuery = {},
): Promise<DictTypeRecord[]> {
  await wait(300);
  return filterMockDictTypes(query);
}

export async function getDictItems(
  typeCode: string,
  query: DictQuery = {},
): Promise<DictItemRecord[]> {
  await wait(300);
  return filterMockDictItems(typeCode, query);
}

export function getDictTypeTotal() {
  return mockDictTypes.length;
}

export async function getSystemConfigs(
  query: ConfigQuery = {},
): Promise<SystemConfigRecord[]> {
  await wait(300);
  return filterMockSystemConfigs(query);
}

export function getSystemConfigTotal() {
  return mockSystemConfigs.length;
}

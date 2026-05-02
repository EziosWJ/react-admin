import {
  filterMockSystemConfigs,
  mockSystemConfigs,
} from "@/mocks/system";
import { http } from "@/lib/http";
import type { ApiPageResult } from "@/types/api";
import type { SystemConfigIntegrationStatus } from "@/types/system";
import type {
  ConfigQuery,
  DictDataBatchDeleteRequest,
  DictDataCreateRequest,
  DictDataListQuery,
  DictDataUpdateRequest,
  DictOption,
  DictTypeBatchDeleteRequest,
  DictTypeCreateRequest,
  DictTypeListQuery,
  DictTypeStatusRequest,
  DictTypeUpdateRequest,
  SystemDictDataRecord,
  SystemDictTypeRecord,
  SystemConfigRecord,
} from "@/types";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function getDictTypes(
  query: DictTypeListQuery,
): Promise<ApiPageResult<SystemDictTypeRecord>> {
  return getDictTypePage(query);
}

const DICT_TYPE_BASE_PATH = "/api/system/dict-type";
const DICT_DATA_BASE_PATH = "/api/system/dict-data";
const dictItemCache = new Map<string, Promise<DictOption[]>>();

export const systemConfigIntegrationStatus: SystemConfigIntegrationStatus =
  "mock-only";

export function getDictTypePage(query: DictTypeListQuery) {
  return http.get<ApiPageResult<SystemDictTypeRecord>>(
    `${DICT_TYPE_BASE_PATH}/page`,
    {
      query,
    },
  );
}

export function getDictTypeDetail(id: number) {
  return http.get<SystemDictTypeRecord>(`${DICT_TYPE_BASE_PATH}/${id}`);
}

export function createDictType(data: DictTypeCreateRequest) {
  return http.post<SystemDictTypeRecord>(DICT_TYPE_BASE_PATH, data);
}

export function updateDictType(id: number, data: DictTypeUpdateRequest) {
  return http.put<SystemDictTypeRecord>(`${DICT_TYPE_BASE_PATH}/${id}`, data);
}

export function deleteDictType(id: number) {
  return http.delete<void>(`${DICT_TYPE_BASE_PATH}/${id}`);
}

export function batchDeleteDictTypes(data: DictTypeBatchDeleteRequest) {
  return http.post<void>(`${DICT_TYPE_BASE_PATH}/batch-delete`, data);
}

export function updateDictTypeStatus(id: number, data: DictTypeStatusRequest) {
  return http.patch<void>(`${DICT_TYPE_BASE_PATH}/${id}/status`, data);
}

export function getDictDataPage(query: DictDataListQuery) {
  return http.get<ApiPageResult<SystemDictDataRecord>>(
    `${DICT_DATA_BASE_PATH}/page`,
    {
      query,
    },
  );
}

export function getDictDataDetail(id: number) {
  return http.get<SystemDictDataRecord>(`${DICT_DATA_BASE_PATH}/${id}`);
}

export function createDictData(data: DictDataCreateRequest) {
  clearDictItemCache();
  return http.post<SystemDictDataRecord>(DICT_DATA_BASE_PATH, data);
}

export function updateDictData(id: number, data: DictDataUpdateRequest) {
  clearDictItemCache();
  return http.put<SystemDictDataRecord>(`${DICT_DATA_BASE_PATH}/${id}`, data);
}

export function deleteDictData(id: number) {
  clearDictItemCache();
  return http.delete<void>(`${DICT_DATA_BASE_PATH}/${id}`);
}

export function batchDeleteDictData(data: DictDataBatchDeleteRequest) {
  clearDictItemCache();
  return http.post<void>(`${DICT_DATA_BASE_PATH}/batch-delete`, data);
}

export function getDictItems(dictCode: string, forceRefresh = false) {
  const normalizedCode = dictCode.trim();

  if (!normalizedCode) {
    return Promise.resolve([]);
  }

  if (forceRefresh || !dictItemCache.has(normalizedCode)) {
    dictItemCache.set(
      normalizedCode,
      http.get<DictOption[]>(
        `/api/system/dict/${encodeURIComponent(normalizedCode)}/items`,
      ),
    );
  }

  return dictItemCache.get(normalizedCode) as Promise<DictOption[]>;
}

export function clearDictItemCache(dictCode?: string) {
  if (dictCode) {
    dictItemCache.delete(dictCode);
    return;
  }

  dictItemCache.clear();
}

export async function getSystemConfigs(
  query: ConfigQuery = {},
): Promise<SystemConfigRecord[]> {
  // 后端文档暂未提供系统配置接口，配置管理先保留本地 mock 数据。
  await wait(300);
  return filterMockSystemConfigs(query);
}

export function getSystemConfigTotal() {
  return mockSystemConfigs.length;
}

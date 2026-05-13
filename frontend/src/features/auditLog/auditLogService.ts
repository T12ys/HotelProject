import { api } from "../../api/axios.tsx";
import type { AuditLogEntry, AuditLogFilterRequest, PagedResult } from "./auditLogTypes.ts";

const BASE = "/admin/audit-logs";

export const getAuditLogs = async (
    params: AuditLogFilterRequest
): Promise<PagedResult<AuditLogEntry>> => {
    // Build query params manually to correctly serialize array values
    const query = new URLSearchParams();

    query.set("page", String(params.page));
    query.set("pageSize", String(params.pageSize));

    if (params.entityType) query.set("entityType", params.entityType);
    if (params.entityId)   query.set("entityId",   params.entityId);
    if (params.actorRole)  query.set("actorRole",  params.actorRole);
    if (params.from)       query.set("from",        params.from);
    if (params.to)         query.set("to",          params.to);

    // Multi-select action types
    (params.actionTypes ?? []).forEach((t) => query.append("actionTypes", t));

    // Multi-select actor user ids
    (params.actorUserIds ?? []).forEach((id) => query.append("actorUserIds", id));

    const { data } = await api.get<PagedResult<AuditLogEntry>>(`${BASE}?${query.toString()}`);
    return data;
};

export const getAuditLogsByEntity = async (
    entityType: string,
    entityId: string
): Promise<AuditLogEntry[]> => {
    const { data } = await api.get<AuditLogEntry[]>(`${BASE}/${entityType}/${entityId}`);
    return data;
};

export const getAuditActionTypes = async (): Promise<string[]> => {
    const { data } = await api.get<string[]>(`${BASE}/action-types`);
    return data;
};
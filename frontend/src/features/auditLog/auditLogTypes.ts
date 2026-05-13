export interface AuditLogEntry {
    id: number;
    actionType: string;
    entityType: string;
    entityId: string;
    oldValue?: string | null;
    newValue?: string | null;
    actorUserId?: string | null;
    actorName?: string | null;
    actorRole?: string | null;
    ip?: string | null;
    timestamp: string;
}

export interface AuditLogFilterRequest {
    page: number;
    pageSize: number;
    entityType?: string;
    entityId?: string;
    actionType?: string;
    actionTypes?: string[];
    actorUserId?: string;
    actorUserIds?: string[];
    actorRole?: string;
    from?: string;
    to?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}
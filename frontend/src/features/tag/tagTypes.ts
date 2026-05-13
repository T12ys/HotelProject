export interface TagResponseDto {
    id: number;
    slug: string;
    translations: Record<string, string>;
}

export interface CreateTagDto {
    translations: Record<string, string>;
}

export interface TagPagedRequest {
    page: number;
    pageSize: number;
    search?: string;
    sortBy?: string;
}
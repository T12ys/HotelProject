export interface RoomResponseDto {
    id: number;
    number: string;
    floor: number;
    isAvailable: boolean;
    roomTypeId: number;
}

export interface RoomPhotoResponseDto {
    id: number;
    url: string;
    sortOrder: number;
    altText: string | null;
}

export interface TagResponseDto {
    id: number;
    name: string;
    slug: string;
}

export interface CreateRoomDto {
    number: string;
    roomTypeId: number;
    floor: number;
}

export interface UpdateRoomDto extends CreateRoomDto {
    id: number;
}

export interface ChangeRoomAvailabilityDto {
    isAvailable: boolean;
}

export interface PagedRequest {
    page: number;
    pageSize: number;
    sortBy?: string;
    search?: string;
}

export interface PagedResult<T> {
    items: readonly T[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface RoomQueryParams {
    page: number;
    pageSize: number;
    search?: string;
    sortBy?: string;
}
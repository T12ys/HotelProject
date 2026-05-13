import { api } from '../../api/axios';
import type {
    RoomTypeResponseDto,
    PagedResult,
    RoomTypeFilterRequest,
    UpdateRoomTypeDto,
    CreateRoomTypeWithPhotosDto,
    AddPhotosDto,
} from './roomTypeTypes';
import type { PagedRequest, RoomResponseDto } from '../room/roomTypes.tsx';

const API_URL = '/room-types';

// GET /api/room-types
export const getRoomTypes = async (
    params: RoomTypeFilterRequest
): Promise<PagedResult<RoomTypeResponseDto>> => {
    const { data } = await api.get<PagedResult<RoomTypeResponseDto>>(API_URL, {
        params: {
            page: params.page,
            pageSize: params.pageSize,
            ...(params.search        && { search: params.search }),
            ...(params.sortBy        && { sortBy: params.sortBy }),
            ...(params.code          && { code: params.code }),
            ...(params.isActive !== undefined && { isActive: params.isActive }),
            ...(params.minCapacity !== undefined && { minCapacity: params.minCapacity }),
            ...(params.maxCapacity   && { maxCapacity: params.maxCapacity }),
            ...(params.minAdults     && { minAdults: params.minAdults }),
            ...(params.maxAdults     && { maxAdults: params.maxAdults }),
            ...(params.minChildren   && { minChildren: params.minChildren }),
            ...(params.maxChildren   && { maxChildren: params.maxChildren }),
            ...(params.minPrice      && { minPrice: params.minPrice }),
            ...(params.maxPrice      && { maxPrice: params.maxPrice }),
            // Фильтр по доступности
            ...(params.checkIn       && { checkIn: params.checkIn }),
            ...(params.checkOut      && { checkOut: params.checkOut }),
        },
        paramsSerializer: (p) => {
            const search = new URLSearchParams();
            Object.entries(p).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => search.append(key, String(v)));
                } else if (value !== undefined) {
                    search.append(key, String(value));
                }
            });
            if (params.tagIds && params.tagIds.length > 0) {
                params.tagIds.forEach((id) => search.append('tagIds', String(id)));
            }
            return search.toString();
        },
    });
    return data;
};

// GET /api/room-types/:id
export const getRoomTypeById = async (id: number): Promise<RoomTypeResponseDto> => {
    const { data } = await api.get<RoomTypeResponseDto>(`${API_URL}/${id}`);
    return data;
};

// GET /api/room-types/:id/rooms
export const getRoomsByTypeId = async (
    roomTypeId: number,
    request: PagedRequest
): Promise<PagedResult<RoomResponseDto>> => {
    const { data } = await api.get<PagedResult<RoomResponseDto>>(
        `${API_URL}/${roomTypeId}/rooms`,
        { params: request }
    );
    return data;
};

// POST /api/room-types
export const createRoomType = async (
    roomTypeData: CreateRoomTypeWithPhotosDto
): Promise<number> => {
    const formData = new FormData();
    formData.append('code', roomTypeData.code);
    formData.append('name', roomTypeData.name);
    formData.append('description', roomTypeData.description);
    formData.append('capacity', roomTypeData.capacity.toString());
    formData.append('maxOccupancyAdults', roomTypeData.maxOccupancyAdults.toString());
    formData.append('maxOccupancyChildren', roomTypeData.maxOccupancyChildren.toString());
    formData.append('basePrice', roomTypeData.basePrice.toString());
    formData.append('isActive', roomTypeData.isActive.toString());



    if (roomTypeData.tagIds && roomTypeData.tagIds.length > 0) {
        roomTypeData.tagIds.forEach((tagId) => {
            formData.append('tagIds', tagId.toString());
        });
    }
    if (roomTypeData.photos && roomTypeData.photos.length > 0) {
        roomTypeData.photos.forEach((photo) => {
            formData.append('photos', photo);
        });
    }

    const { data } = await api.post<number>(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

// PUT /api/room-types/:id
export const updateRoomType = async (
    id: number,
    roomTypeData: UpdateRoomTypeDto
): Promise<void> => {
    await api.put(`${API_URL}/${id}`, roomTypeData);
};

// DELETE /api/room-types/:id
export const deleteRoomType = async (id: number): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
};

// POST /api/room-types/:id/photos
export const addPhotos = async (
    roomTypeId: number,
    photosData: AddPhotosDto
): Promise<void> => {
    const formData = new FormData();
    photosData.photos.forEach((photo) => {
        formData.append('photos', photo);
    });
    await api.post(`${API_URL}/${roomTypeId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// DELETE /api/room-types/photos/:photoId
export const deletePhoto = async (photoId: number): Promise<void> => {
    await api.delete(`${API_URL}/photos/${photoId}`);
};
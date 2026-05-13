import { api } from '../../api/axios';
import type {
    RoomResponseDto,
    PagedResult,
    RoomQueryParams,
    CreateRoomDto,
    UpdateRoomDto
} from './roomTypes.ts';

const API_URL = '/rooms';


export const getRooms = async (params: RoomQueryParams): Promise<PagedResult<RoomResponseDto>> => {
    const { data } = await api.get<PagedResult<RoomResponseDto>>(API_URL, {
        params: {
            page: params.page,
            pageSize: params.pageSize,
            ...(params.search && { search: params.search }),
            ...(params.sortBy && { sortBy: params.sortBy }),
        }
    });
    return data;
};


export const getRoomById = async (id: number): Promise<RoomResponseDto> => {
    const { data } = await api.get<RoomResponseDto>(`${API_URL}/${id}`);
    return data;
};


export const createRoom = async (roomData: CreateRoomDto): Promise<number> => {
    const { data } = await api.post<number>(API_URL, roomData);
    return data;
};


export const updateRoom = async (id: number, roomData: UpdateRoomDto): Promise<void> => {
    await api.put(`${API_URL}/${id}`, roomData);
};


export const changeAvailability = async (id: number, isAvailable: boolean): Promise<void> => {
    await api.patch(`${API_URL}/${id}/availability`, { isAvailable });
};


export const deleteRoom = async (id: number): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
};
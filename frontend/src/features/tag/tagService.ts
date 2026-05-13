import { api } from '../../api/axios';
import type { TagResponseDto, CreateTagDto, TagPagedRequest } from './tagTypes.ts';
import type { PagedResult } from '../room/roomTypes.ts';

const API_URL = '/tags';

export const getTags = async (params: TagPagedRequest): Promise<PagedResult<TagResponseDto>> => {
    const { data } = await api.get<PagedResult<TagResponseDto>>(API_URL, { params });
    return data;
};

export const getTagById = async (id: number): Promise<TagResponseDto> => {
    const { data } = await api.get<TagResponseDto>(`${API_URL}/${id}`);
    return data;
};

export const createTag = async (dto: CreateTagDto): Promise<number> => {
    const { data } = await api.post<number>(API_URL, dto);
    return data;
};

export const updateTag = async (id: number, dto: CreateTagDto): Promise<void> => {
    await api.put(`${API_URL}/${id}`, dto);
};

export const deleteTag = async (id: number): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
};
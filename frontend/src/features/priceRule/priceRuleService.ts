// src/features/priceRule/priceRuleService.ts
import { api } from '../../api/axios';
import type {
    PriceRuleResponseDto,
    CreatePriceRuleDto,
    UpdatePriceRuleDto,
    PeriodRulesRequestDto,
    PriceCalculationRequestDto,
    PriceCalculationResponseDto,
    PagedResult,
} from './priceRuleTypes';
import type {RoomTypeResponseDto} from "../roomType/roomTypeTypes.ts";

const URL = '/price-rules';

export const getPriceRulesByRoomType = async (
    roomTypeId: number,
    page = 1,
    pageSize = 20
): Promise<PagedResult<PriceRuleResponseDto>> => {
    const { data } = await api.get<PagedResult<PriceRuleResponseDto>>(URL, {
        params: { roomTypeId, page, pageSize },
    });
    return data;
};

export const getPriceRulesForPeriod = async (
    dto: PeriodRulesRequestDto
): Promise<PagedResult<PriceRuleResponseDto>> => {
    const { data } = await api.get<PagedResult<PriceRuleResponseDto>>(`${URL}/period`, {
        params: dto,
    });
    return data;
};

export const getAllPriceRules = async (
    roomTypeId: number | null,
    page = 1,
    pageSize = 200,
    sortBy = 'startDate:asc'
): Promise<PagedResult<PriceRuleResponseDto>> => {
    const { data } = await api.get<PagedResult<PriceRuleResponseDto>>(`${URL}/all`, {
        params: { roomTypeId: roomTypeId ?? undefined, page, pageSize, sortBy },
    });
    return data;
};

export const calculatePrice = async (
    dto: PriceCalculationRequestDto
): Promise<PriceCalculationResponseDto> => {
    const { data } = await api.get<PriceCalculationResponseDto>(`${URL}/calculate`, {
        params: dto,
    });
    return data;
};

export const createPriceRule = async (dto: CreatePriceRuleDto): Promise<number> => {
    const { data } = await api.post<number>(URL, dto);
    return data;
};

export const updatePriceRule = async (id: number, dto: UpdatePriceRuleDto): Promise<void> => {
    await api.put(`${URL}/${id}`, dto);
};

export const deletePriceRule = async (id: number): Promise<void> => {
    await api.delete(`${URL}/${id}`);
};

export const getDiscountedRoomTypes = async (
    page = 1,
    pageSize = 20
): Promise<PagedResult<RoomTypeResponseDto>> => {
    const { data } = await api.get<PagedResult<RoomTypeResponseDto>>(`${URL}/discounted`, {
        params: { page, pageSize },
    });
    return data;
};
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type {
    CreatePriceRuleDto,
    UpdatePriceRuleDto,
    PeriodRulesRequestDto,
    PriceCalculationRequestDto,
} from './priceRuleTypes';
import {
    getPriceRulesByRoomType,
    getPriceRulesForPeriod,
    getAllPriceRules,
    calculatePrice,
    createPriceRule,
    updatePriceRule,
    deletePriceRule, getDiscountedRoomTypes,
} from './priceRuleService';

export const usePriceRulesByRoomType = (roomTypeId: number, page = 1, pageSize = 20) =>
    useQuery({
        queryKey: ['price-rules', roomTypeId, page, pageSize],
        queryFn: () => getPriceRulesByRoomType(roomTypeId, page, pageSize),
        placeholderData: keepPreviousData,
        enabled: !!roomTypeId,
    });

export const usePriceRulesForPeriod = (dto: PeriodRulesRequestDto) =>
    useQuery({
        queryKey: ['price-rules-period', dto],
        queryFn: () => getPriceRulesForPeriod(dto),
        placeholderData: keepPreviousData,
        enabled: !!dto.roomTypeId,
    });

export const useAllPriceRules = (roomTypeId: number | null, page = 1, pageSize = 200, sortBy = 'startDate:asc') =>
    useQuery({
        queryKey: ['price-rules-all', roomTypeId, page, pageSize, sortBy],
        queryFn: () => getAllPriceRules(roomTypeId, page, pageSize, sortBy),
        placeholderData: keepPreviousData,
    });

export const usePriceCalculation = (dto: PriceCalculationRequestDto | null) =>
    useQuery({
        queryKey: ['price-calculation', dto],
        queryFn: () => calculatePrice(dto!),
        enabled: !!dto && !!dto.roomTypeId && !!dto.startDate && !!dto.endDate,
    });

export const useDiscountedRoomTypes = (page = 1, pageSize = 20) =>
    useQuery({
        queryKey: ['price-rules-discounted', page, pageSize],
        queryFn: () => getDiscountedRoomTypes(page, pageSize),
        placeholderData: keepPreviousData,
    });

export const useCreatePriceRule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePriceRuleDto) => createPriceRule(data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['price-rules'] });
            void qc.invalidateQueries({ queryKey: ['price-rules-period'] });
            void qc.invalidateQueries({ queryKey: ['price-rules-all'] });
        },
    });
};

export const useUpdatePriceRule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePriceRuleDto }) =>
            updatePriceRule(id, data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['price-rules'] });
            void qc.invalidateQueries({ queryKey: ['price-rules-period'] });
            void qc.invalidateQueries({ queryKey: ['price-rules-all'] });
        },
    });
};

export const useDeletePriceRule = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deletePriceRule,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['price-rules'] });
            void qc.invalidateQueries({ queryKey: ['price-rules-period'] });
            void qc.invalidateQueries({ queryKey: ['price-rules-all'] });
        },
    });
};


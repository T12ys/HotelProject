// src/features/priceRule/priceRuleTypes.ts

export const RuleType = {
    SeasonalRange: 0,
    SpecialDate: 1,
} as const;

export type RuleType = typeof RuleType[keyof typeof RuleType]; //used for comparison only

export interface PriceRuleResponseDto {
    id: number;
    name: string;
    ruleType: number;
    roomTypeId: number | null;
    startDate: string;
    endDate: string;
    isIncrease: boolean;
    isPercent: boolean;
    value: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreatePriceRuleDto {
    name: string;
    ruleType: number;
    roomTypeId?: number | null;
    startDate: string;
    endDate: string;
    isIncrease: boolean;
    isPercent: boolean;
    value: number;
}

export interface UpdatePriceRuleDto {
    name: string;
    ruleType: number;
    startDate: string;
    endDate: string;
    isIncrease: boolean;
    isPercent: boolean;
    value: number;
    isActive: boolean;
}

export interface PeriodRulesRequestDto {
    roomTypeId: number;
    from: string;
    to?: string;
    page: number;
    pageSize: number;
}

export interface PriceCalculationRequestDto {
    roomTypeId: number;
    startDate: string;
    endDate: string;
}

export interface AppliedRuleDto {
    ruleId: number;
    ruleName: string;
    priceDelta: number;
}

export interface DailyPriceDto {
    date: string;
    basePrice: number;
    finalPrice: number;
    hasModifiers: boolean;
    appliedRules: AppliedRuleDto[];
}

export interface PriceCalculationResponseDto {
    roomTypeId: number;
    startDate: string;
    endDate: string;
    nights: number;
    baseTotalPrice: number;
    finalTotalPrice: number;
    dailyBreakdown: DailyPriceDto[];
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}
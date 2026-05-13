// src/components/ui/PriceRuleModal.tsx
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RuleType } from '../../features/priceRule/priceRuleTypes';
import type { PriceRuleResponseDto } from '../../features/priceRule/priceRuleTypes';
import { useCreatePriceRule, useUpdatePriceRule } from '../../features/priceRule/usePriceRule';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/errorHandler.ts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DATE_FORMAT } from "../../utils/datePickerConfig";


function toISO(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function fromISO(iso: string): Date | null {
    if (!iso) return null;
    return new Date(iso + 'T00:00:00');
}

interface Props {
    isOpen: boolean;
    mode: 'create' | 'edit';
    roomTypeId: number;
    initialData?: PriceRuleResponseDto;
    onClose: () => void;
}

interface FormValues {
    name: string;
    ruleType: number;
    startDate: string;
    endDate: string;
    isIncrease: boolean;
    isPercent: boolean;
    value: number;
    isActive: boolean;
    isGlobal: boolean;
}

const toRuleTypeNumber = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (val === 'SeasonalRange') return RuleType.SeasonalRange;
    if (val === 'SpecialDate') return RuleType.SpecialDate;
    return Number(val);
};

export default function PriceRuleModal({ isOpen, mode, roomTypeId, initialData, onClose }: Props) {
    const { t, i18n } = useTranslation();
    const createMutation = useCreatePriceRule();
    const updateMutation = useUpdatePriceRule();

    const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            name: '',
            ruleType: RuleType.SeasonalRange,
            startDate: '',
            endDate: '',
            isIncrease: true,
            isPercent: false,
            value: 0,
            isActive: true,
            isGlobal: false,
        },
    });

    const ruleType  = watch('ruleType');
    const startDate = watch('startDate');
    const isPercent = watch('isPercent');
    const isPercentBool = isPercent === true || (isPercent as unknown) === 'true';
    const today = new Date();
    const isSpecialDate = Number(ruleType) === RuleType.SpecialDate;

    const lang = i18n.language;
    const fmt  = DATE_FORMAT[lang] ?? 'dd.MM.yyyy';
    const placeholder = t('booking.datePlaceholder');

    useEffect(() => {
        if (isSpecialDate) {
            setValue('endDate', startDate);
        }
    }, [ruleType, startDate, setValue, isSpecialDate]);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            reset({
                name:       initialData.name,
                ruleType:   toRuleTypeNumber(initialData.ruleType),
                startDate:  initialData.startDate.split('T')[0],
                endDate:    initialData.endDate.split('T')[0],
                isIncrease: initialData.isIncrease,
                isPercent:  initialData.isPercent,
                value:      initialData.value,
                isActive:   initialData.isActive,
                isGlobal:   initialData.roomTypeId === null,
            });
        } else if (mode === 'create') {
            reset({
                name: '',
                ruleType: RuleType.SeasonalRange,
                startDate: '',
                endDate: '',
                isIncrease: true,
                isPercent: false,
                value: 0,
                isActive: true,
                isGlobal: false,
            });
        }
    }, [mode, initialData, reset, isOpen]);

    const RULE_TYPE_OPTIONS = [
        { value: RuleType.SeasonalRange, label: t('priceRuleModal.ruleTypes.SeasonalRange') },
        { value: RuleType.SpecialDate,   label: t('priceRuleModal.ruleTypes.SpecialDate')   },
    ];

    const onSubmit = async (values: FormValues) => {
        try {
            const normalized = {
                ...values,
                ruleType:   toRuleTypeNumber(values.ruleType),
                value:      Number(values.value),
                isIncrease: values.isIncrease || (values.isIncrease as unknown) === 'true',
                isPercent:  values.isPercent  || (values.isPercent  as unknown) === 'true',
                startDate:  new Date(values.startDate + 'T00:00:00').toISOString(),
                endDate:    new Date((values.endDate || values.startDate) + 'T00:00:00').toISOString(),
            };

            if (mode === 'create') {
                await toast.promise(
                    createMutation.mutateAsync({
                        ...normalized,
                        roomTypeId: normalized.isGlobal ? null : roomTypeId,
                    }),
                    {
                        loading: t('priceRuleModal.creating'),
                        success: t('priceRuleModal.created'),
                        error:   (err) => getErrorMessage(err),
                    }
                );
            } else if (initialData) {
                await toast.promise(
                    updateMutation.mutateAsync({ id: initialData.id, data: normalized }),
                    {
                        loading: t('priceRuleModal.saving'),
                        success: t('priceRuleModal.updated'),
                        error:   (err) => getErrorMessage(err),
                    }
                );
            }
            onClose();
        } catch {
            // error already shown via toast.promise
        }
    };

    if (!isOpen) return null;

    const isPending = createMutation.isPending || updateMutation.isPending;

    const pickerClass = (hasError: boolean) =>
        `w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gray-400 ${hasError ? 'border-red-400' : 'border-gray-300'}`;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">
                    {mode === 'create' ? t('priceRuleModal.createTitle') : t('priceRuleModal.editTitle')}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceRuleModal.name')}</label>
                        <input
                            {...register('name', { required: t('priceRuleModal.validation.required'), maxLength: 200 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                            placeholder={t('priceRuleModal.namePlaceholder')}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Rule type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceRuleModal.ruleType')}</label>
                        <select
                            value={watch('ruleType')}
                            onChange={(e) => setValue('ruleType', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                        >
                            {RULE_TYPE_OPTIONS.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceRuleModal.startDate')}</label>
                            <Controller
                                name="startDate"
                                control={control}
                                rules={{ required: t('priceRuleModal.validation.required') }}
                                render={({ field }) => (
                                    <DatePicker
                                        selected={fromISO(field.value)}
                                        onChange={(date: Date | null) => field.onChange(toISO(date))}
                                        minDate={today}
                                        locale={lang}
                                        dateFormat={fmt}
                                        placeholderText={placeholder}
                                        className={pickerClass(!!errors.startDate)}
                                    />
                                )}
                            />
                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {isSpecialDate ? t('priceRuleModal.endDateAuto') : t('priceRuleModal.endDate')}
                            </label>
                            <Controller
                                name="endDate"
                                control={control}
                                rules={{ required: !isSpecialDate ? t('priceRuleModal.validation.required') : false }}
                                render={({ field }) => (
                                    <DatePicker
                                        selected={fromISO(field.value)}
                                        onChange={(date: Date | null) => field.onChange(toISO(date))}
                                        minDate={fromISO(startDate) ?? today}
                                        locale={lang}
                                        dateFormat={fmt}
                                        placeholderText={placeholder}
                                        disabled={isSpecialDate}
                                        className={pickerClass(!!errors.endDate) + (isSpecialDate ? ' bg-gray-100 text-gray-400' : '')}
                                    />
                                )}
                            />
                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                        </div>
                    </div>

                    {/* Increase / Discount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('priceRuleModal.changeType')}</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={watch('isIncrease') === true || (watch('isIncrease') as unknown) === 'true'}
                                    onChange={() => setValue('isIncrease', true)}
                                />
                                <span className="text-sm text-green-600 font-medium">{t('priceRuleModal.increase')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={watch('isIncrease') === false || (watch('isIncrease') as unknown) === 'false'}
                                    onChange={() => setValue('isIncrease', false)}
                                />
                                <span className="text-sm text-red-500 font-medium">{t('priceRuleModal.discount')}</span>
                            </label>
                        </div>
                    </div>

                    {/* Value */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('priceRuleModal.value')}</label>
                        <div className="flex gap-3 items-start">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={isPercentBool ? 100 : undefined}
                                    {...register('value', {
                                        required: t('priceRuleModal.validation.required'),
                                        min: { value: 0.01, message: t('priceRuleModal.validation.min') },
                                        max: isPercentBool
                                            ? { value: 100, message: t('priceRuleModal.validation.maxPercent') }
                                            : undefined,
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                                />
                                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <label className="flex items-center gap-1 cursor-pointer text-sm">
                                    <input
                                        type="radio"
                                        checked={watch('isPercent') === false || (watch('isPercent') as unknown) === 'false'}
                                        onChange={() => setValue('isPercent', false)}
                                    />
                                    <span>₼</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer text-sm">
                                    <input
                                        type="radio"
                                        checked={watch('isPercent') === true || (watch('isPercent') as unknown) === 'true'}
                                        onChange={() => setValue('isPercent', true)}
                                    />
                                    <span>%</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Global rule — create only */}
                    {mode === 'create' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={watch('isGlobal') === true}
                                onChange={(e) => setValue('isGlobal', e.target.checked)}
                                className="w-4 h-4 accent-orange-500"
                            />
                            <span className="text-sm text-gray-700">
                                {t('priceRuleModal.global')}
                                <span className="text-gray-400 text-xs ml-1">{t('priceRuleModal.globalHint')}</span>
                            </span>
                        </label>
                    )}

                    {/* isActive — edit only */}
                    {mode === 'edit' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={watch('isActive') === true}
                                onChange={(e) => setValue('isActive', e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">{t('priceRuleModal.isActive')}</span>
                        </label>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                        >
                            {t('priceRuleModal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            {isPending ? t('priceRuleModal.saving') : t('priceRuleModal.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// src/api/errorHandler.ts
import type { AxiosError } from 'axios';
import i18n from '../i18n';

interface ProblemDetails {
    title?: string;
    detail?: string;
    errors?: Record<string, string[]>;
    status?: number;
}

export const getErrorMessage = (error: unknown): string => {
    const axiosError = error as AxiosError<ProblemDetails>;
    const t = i18n.t.bind(i18n);

    if (!axiosError.response) {
        return t('errors.serverUnavailable');
    }

    const { status, data } = axiosError.response;

    if (data?.errors) {
        const messages = Object.values(data.errors).flat();
        if (messages.length > 0) return messages.join('\n');
    }

    if (data?.detail) return data.detail;
    if (data?.title) return data.title;

    switch (status) {
        case 400: return t('errors.badRequest');
        case 401: return t('errors.unauthorized');
        case 403: return t('errors.forbidden');
        case 404: return t('errors.notFound');
        case 409: return t('errors.conflict');
        case 422: return t('errors.validation');
        case 500: return t('errors.server');
        default:  return t('errors.default', { status });
    }
};
import { api } from '../../api/axios';
import type {
    CreateReservationDto,
    UpdateReservationDto,
    ReservationResponseDto,
    MockPaymentDto,
    ReservationFilterRequest,
    PagedResult,
} from './reservationTypes';

const BASE = '/reservations';
const PAY  = '/payments';

export const createReservation = async (dto: CreateReservationDto): Promise<ReservationResponseDto> => {
    const { data } = await api.post<ReservationResponseDto>(BASE, dto);
    return data;
};

export const getReservationById = async (id: string): Promise<ReservationResponseDto> => {
    const { data } = await api.get<ReservationResponseDto>(`${BASE}/${id}`);
    return data;
};

export const getReservations = async (filter: ReservationFilterRequest): Promise<PagedResult<ReservationResponseDto>> => {
    const { data } = await api.get<PagedResult<ReservationResponseDto>>(BASE, {
        params: {
            page:      filter.page      ?? 1,
            pageSize:  filter.pageSize  ?? 50,
            ...(filter.roomTypeId  !== undefined && { roomTypeId:     filter.roomTypeId }),
            ...(filter.roomId      !== undefined && { roomId:         filter.roomId }),
            ...(filter.status                    && { status:         filter.status }),
            ...(filter.from                      && { from:           filter.from }),
            ...(filter.to                        && { to:             filter.to }),
            ...(filter.customerEmail             && { customerEmail:  filter.customerEmail }),
        },
    });
    return data;
};

// PUT /api/reservations/:id — update dates / status / notes (requires auth)
export const updateReservation = async (id: string, dto: UpdateReservationDto): Promise<ReservationResponseDto> => {
    const { data } = await api.put<ReservationResponseDto>(`${BASE}/${id}`, dto);
    return data;
};

// DELETE /api/reservations/:id — cancel a reservation (requires auth)
export const cancelReservation = async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
};

export const processMockPayment = async (dto: MockPaymentDto): Promise<ReservationResponseDto> => {
    const { data } = await api.post<ReservationResponseDto>(`${PAY}/mock`, dto);
    return data;
};

// GET /api/user/reservations — current user's reservations
export const getMyReservations = async (page: number, pageSize: number): Promise<PagedResult<ReservationResponseDto>> => {
    const { data } = await api.get<PagedResult<ReservationResponseDto>>('/user/reservations', {
        params: { page, pageSize }
    });
    return data;
};

// POST /api/user/reservations/:id/cancel — cancel current user's reservation
export const cancelMyReservation = async (id: string): Promise<void> => {
    await api.post(`/user/reservations/${id}/cancel`);
};
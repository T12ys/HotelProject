export type ReservationStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";

export interface ReservationItemResponseDto {
    id: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
}

export interface ReservationResponseDto {
    id: string;
    roomId: number;
    roomNumber: string;
    roomTypeId: number;
    roomTypeName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    startDate: string;
    endDate: string;
    nightsCount: number;
    totalPrice: number;
    status: ReservationStatus;
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
    heldUntil: string | null;
    notes: string | null;
    source: string;
    items: ReservationItemResponseDto[];
}

export interface ReservationItemDto {
    name: string;
    price: number;
    quantity: number;
}

export interface CreateReservationDto {
    roomTypeId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    startDate: string;
    endDate: string;
    guestCount: number;
    notes?: string;
    items?: ReservationItemDto[];
}

export interface UpdateReservationDto {
    startDate?: string;
    endDate?: string;
    status?: ReservationStatus;
    notes?: string;
}

export interface MockPaymentDto {
    reservationId: string;
    simulateSuccess: boolean;
}

export interface ReservationFilterRequest {
    page?: number;
    pageSize?: number;
    roomTypeId?: number;
    roomId?: number;
    status?: ReservationStatus;
    from?: string;
    to?: string;
    customerEmail?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}
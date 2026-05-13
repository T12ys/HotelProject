import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import type {
    RoomTypeFilterRequest,
    CreateRoomTypeWithPhotosDto,
    UpdateRoomTypeDto,
    AddPhotosDto,
} from './roomTypeTypes.ts';
import {
    getRoomsByTypeId,
    getRoomTypes,
    getRoomTypeById,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    addPhotos,
    deletePhoto,
} from './roomTypeService.ts';

import type { PagedRequest } from '../room/roomTypes.ts'

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useRoomsByTypeId = (
    roomTypeId: number,
    params: PagedRequest
) => {
    return useQuery({
        queryKey: ['rooms-by-type', roomTypeId, params],
        queryFn: () => getRoomsByTypeId(roomTypeId, params),
        placeholderData: keepPreviousData,
        enabled: !!roomTypeId, // only fetch when roomTypeId is defined
    });
};

// Paginated query (page buttons)
export const useRoomTypes = (params: RoomTypeFilterRequest) => {
    return useQuery({
        queryKey: ['room-types', params],
        queryFn: () => getRoomTypes(params),
        placeholderData: keepPreviousData,
    });
};

// Infinite scroll query
export const useInfiniteRoomTypes = (
    params: Omit<RoomTypeFilterRequest, 'page'>
) => {
    return useInfiniteQuery({
        queryKey: ['room-types-infinite', params],
        queryFn: ({ pageParam = 1 }) =>
            getRoomTypes({ ...params, page: pageParam }),

        getNextPageParam: (lastPage) => {
            const { page, pageSize, totalCount } = lastPage;
            const totalPages = Math.ceil(totalCount / pageSize);
            return page < totalPages ? page + 1 : undefined;
        },

        initialPageParam: 1,
    });
};

export const useInfiniteRoomsByTypeId = (
    roomTypeId: number,
    params: Omit<PagedRequest, 'page'>
) => {
    return useInfiniteQuery({
        queryKey: ['rooms-by-type-infinite', roomTypeId, params],
        queryFn: ({ pageParam = 1 }) =>
            getRoomsByTypeId(roomTypeId, { ...params, page: pageParam }),

        getNextPageParam: (lastPage) => {
            const { page, pageSize, totalCount } = lastPage;
            const totalPages = Math.ceil(totalCount / pageSize);
            return page < totalPages ? page + 1 : undefined;
        },

        initialPageParam: 1,
        enabled: !!roomTypeId,
    });
};

export const useRoomType = (id: number) => {
    return useQuery({
        queryKey: ['room-type', id],
        queryFn: () => getRoomTypeById(id),
        enabled: !!id,
    });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

// Create a room type (with photos)
export const useCreateRoomType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRoomTypeWithPhotosDto) => createRoomType(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['room-types'] });
            void queryClient.invalidateQueries({ queryKey: ['room-types-infinite'] });
        },
    });
};

// Update a room type (without photos)
export const useUpdateRoomType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateRoomTypeDto }) =>
            updateRoomType(id, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['room-types'] });
            void queryClient.invalidateQueries({ queryKey: ['room-types-infinite'] });
            void queryClient.invalidateQueries({ queryKey: ['room-type'] });
        },
    });
};

// Delete a room type
export const useDeleteRoomType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteRoomType,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['room-types'] });
            void queryClient.invalidateQueries({ queryKey: ['room-types-infinite'] });
        },
    });
};

// ─── Photo mutations ──────────────────────────────────────────────────────────

// Add photos to an existing room type
export const useAddPhotos = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AddPhotosDto }) =>
            addPhotos(id, data),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['room-types'] });
            void queryClient.invalidateQueries({ queryKey: ['room-types-infinite'] });
            void queryClient.invalidateQueries({
                queryKey: ['room-type', variables.id],
            });
        },
    });
};

// Delete a photo
export const useDeletePhoto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePhoto,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['room-types'] });
            void queryClient.invalidateQueries({ queryKey: ['room-types-infinite'] });
            void queryClient.invalidateQueries({ queryKey: ['room-type'] });
        },
    });
};
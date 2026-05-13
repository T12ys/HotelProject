import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    keepPreviousData
} from '@tanstack/react-query';
import type { RoomQueryParams, CreateRoomDto, UpdateRoomDto } from './roomTypes.ts';
import {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    changeAvailability,
    deleteRoom
} from './roomService.ts';


// Paginated query (page buttons)
export const useRooms = (params: RoomQueryParams) => {
    return useQuery({
        queryKey: ['rooms', params],
        queryFn: () => getRooms(params),
        placeholderData: keepPreviousData,
    });
};


// Infinite scroll query
export const useInfiniteRooms = (params: Omit<RoomQueryParams, 'page'>) => {
    return useInfiniteQuery({
        queryKey: ['rooms-infinite', params],
        queryFn: ({ pageParam = 1 }) =>
            getRooms({ ...params, page: pageParam }),

        // Returns the next page number, or undefined when all pages are loaded
        getNextPageParam: (lastPage) => {
            const { page, pageSize, totalCount } = lastPage;
            const totalPages = Math.ceil(totalCount / pageSize);
            return page < totalPages ? page + 1 : undefined;
        },

        initialPageParam: 1,
    });
};



export const useRoom = (id: number) => {
    return useQuery({
        queryKey: ['room', id],
        queryFn: () => getRoomById(id),
        enabled: !!id,
    });
};

export const useCreateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRoomDto) => createRoom(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['rooms'] });
            void queryClient.invalidateQueries({ queryKey: ['rooms-infinite'] });
        },
    });
};

export const useUpdateRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateRoomDto }) =>
            updateRoom(id, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['rooms'] });
            void queryClient.invalidateQueries({ queryKey: ['rooms-infinite'] });
            void queryClient.invalidateQueries({ queryKey: ['room'] });
        },
    });
};

export const useChangeAvailability = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
            changeAvailability(id, isAvailable),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['rooms'] });
            void queryClient.invalidateQueries({ queryKey: ['rooms-infinite'] });
            void queryClient.invalidateQueries({ queryKey: ['room'] });
        },
    });
};

export const useDeleteRoom = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteRoom,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['rooms'] });
            void queryClient.invalidateQueries({ queryKey: ['rooms-infinite'] });
        },
        meta: { skipGlobalError: true }
    });
};
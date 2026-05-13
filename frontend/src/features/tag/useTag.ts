import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTagDto, TagPagedRequest } from './tagTypes.ts';
import { getTags, createTag, updateTag, deleteTag } from './tagService.ts';

export const useInfiniteTags = (params: Omit<TagPagedRequest, 'page'>) => {
    return useInfiniteQuery({
        queryKey: ['tags-infinite', params],
        queryFn: ({ pageParam = 1 }) => getTags({ ...params, page: pageParam }),
        getNextPageParam: (lastPage) => {
            const totalPages = Math.ceil(lastPage.totalCount / lastPage.pageSize);
            return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
        },
        initialPageParam: 1,
    });
};

export const useCreateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateTagDto) => createTag(dto),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['tags-infinite'] });
        },
    });
};

export const useUpdateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: CreateTagDto }) => updateTag(id, dto),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['tags-infinite'] });
        },
    });
};

export const useDeleteTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTag,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['tags-infinite'] });
        },
    });
};
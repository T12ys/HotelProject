import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../api/errorHandler";
import { useInfiniteRoomTypes } from "../../features/roomType/useRoomTypes.ts";
import { useInfiniteRooms, useDeleteRoom } from "../../features/room/useRoom.ts";
import { useInfiniteRoomsByTypeId } from "../../features/roomType/useRoomTypes.ts";
import RoomTypeDropdown from "../../components/ui/RoomTypeDropdown";
import RoomListItem from "../../components/ui/RoomListItem";
import RoomModal from "../../components/ui/RoomModal";
import RoomTypeModal from "../../components/ui/RoomTypeModal";
import TagsModal from "../../components/ui/TagsModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import type { RoomResponseDto } from "../../features/room/roomTypes.ts";
import type { RoomTypeResponseDto } from "../../features/roomType/roomTypeTypes.ts";

const RoomsAdmin = () => {
    const { t } = useTranslation();
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const [roomModalState, setRoomModalState] = useState<{
        isOpen: boolean; mode: "create" | "edit"; data?: RoomResponseDto;
    }>({ isOpen: false, mode: "create" });

    const [roomTypeModalState, setRoomTypeModalState] = useState<{
        isOpen: boolean; mode: "create" | "edit"; data?: RoomTypeResponseDto;
    }>({ isOpen: false, mode: "create" });

    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

    const { data: roomTypesData } = useInfiniteRoomTypes({ pageSize: 5, search: "", sortBy: "Name:asc" });
    const allRoomsQuery = useInfiniteRooms({ pageSize: 10, search: searchTerm, sortBy: "Number:asc" });
    const roomsByTypeQuery = useInfiniteRoomsByTypeId(selectedTypeId || 0, { pageSize: 20, search: searchTerm, sortBy: "Number:asc" });

    const { data: roomsData, isLoading: isLoadingRooms, error: roomsError, fetchNextPage, hasNextPage, isFetchingNextPage } =
        selectedTypeId === null ? allRoomsQuery : roomsByTypeQuery;

    const deleteMutation = useDeleteRoom();
    const allRoomTypes = roomTypesData?.pages.flatMap((page) => page.items).filter(Boolean) || [];
    const allRooms = roomsData?.pages.flatMap((page) => page.items).filter(Boolean) || [];
    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage();
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    useEffect(() => {
        const element = observerTarget.current;
        if (!element) return;
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
        observer.observe(element);
        return () => observer.disconnect();
    }, [handleObserver]);

    const handleDeleteConfirm = async () => {
        if (!confirmId) return;
        await toast.promise(deleteMutation.mutateAsync(confirmId), {
            loading: t("common.deleting"),
            success: t("common.success"),
            error: (err) => getErrorMessage(err),
        });
        setConfirmId(null);
    };

    const handleDeleteRoomType = (typeId: number) => {
        alert(t("roomsAdmin.deleteTypeComingSoon") + ` (id: ${typeId})`);
    };

    const handleEditRoom = (id: number) => {
        const room = allRooms.find((r) => r.id === id);
        if (room) setRoomModalState({ isOpen: true, mode: "edit", data: room });
    };

    const handleEditRoomType = (typeId: number) => {
        const roomType = allRoomTypes.find((t) => t.id === typeId);
        if (roomType) setRoomTypeModalState({ isOpen: true, mode: "edit", data: roomType });
    };

    return (
        <div className="h-full p-6 flex flex-col">
            <div className="flex gap-4 mb-6 shrink-0">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder={t("roomsAdmin.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-400"
                    />
                </div>

                <button
                    onClick={() => setRoomModalState({ isOpen: true, mode: "create" })}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t("roomsAdmin.addRoom")}</span>
                </button>

                <button
                    onClick={() => setIsTagsModalOpen(true)}
                    className="px-4 py-2 border border-stone-300 bg-white hover:border-stone-400 text-stone-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                    </svg>
                    <span>{t("roomsAdmin.tags")}</span>
                </button>

                <RoomTypeDropdown
                    selectedTypeId={selectedTypeId}
                    onTypeSelect={setSelectedTypeId}
                    onAddRoomType={() => setRoomTypeModalState({ isOpen: true, mode: "create" })}
                    onEditRoomType={handleEditRoomType}
                    onDeleteRoomType={handleDeleteRoomType}
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                    {isLoadingRooms && (
                        <div className="text-center py-8 text-stone-500">{t("roomsAdmin.loadingRooms")}</div>
                    )}

                    {allRooms.map((room) => (
                        <RoomListItem
                            key={room.id}
                            room={room}
                            onEdit={handleEditRoom}
                            onDelete={(id) => setConfirmId(id)}
                            isDeleting={deleteMutation.isPending}
                        />
                    ))}

                    <div ref={observerTarget} className="py-4 text-center">
                        {isFetchingNextPage && <div className="text-stone-500">{t("roomsAdmin.loadingMore")}</div>}
                        {!hasNextPage && allRooms.length > 0 && <div className="text-stone-400">{t("roomsAdmin.allLoaded")}</div>}
                    </div>

                    {!isLoadingRooms && !roomsError && allRooms.length === 0 && (
                        <div className="text-center py-12 text-stone-500">
                            <p>{t("roomsAdmin.notFound")}</p>
                            <p className="text-sm mt-2">{t("roomsAdmin.notFoundHint")}</p>
                        </div>
                    )}
                </div>
            </div>

            <RoomModal
                isOpen={roomModalState.isOpen}
                mode={roomModalState.mode}
                initialData={roomModalState.data}
                onClose={() => setRoomModalState({ isOpen: false, mode: "create" })}
            />
            <RoomTypeModal
                key={roomTypeModalState.data?.id ?? "create"}
                isOpen={roomTypeModalState.isOpen}
                mode={roomTypeModalState.mode}
                initialData={roomTypeModalState.data}
                onClose={() => setRoomTypeModalState({ isOpen: false, mode: "create" })}
            />
            <TagsModal isOpen={isTagsModalOpen} onClose={() => setIsTagsModalOpen(false)} />

            <ConfirmDialog
                isOpen={confirmId !== null}
                title={t("roomsAdmin.deleteConfirm")}
                confirmText={t("common.confirm")}
                cancelText={t("common.cancel")}
                danger
                isLoading={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
};

export default RoomsAdmin;
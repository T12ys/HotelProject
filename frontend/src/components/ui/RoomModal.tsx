import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCreateRoom, useUpdateRoom, useChangeAvailability } from "../../features/room/useRoom.ts";
import { useInfiniteRoomTypes } from "../../features/roomType/useRoomTypes.ts";
import type { RoomResponseDto } from "../../features/room/roomTypes.ts";

interface Props {
    isOpen: boolean;
    mode: "create" | "edit";
    initialData?: RoomResponseDto;
    onClose: () => void;
}

function RoomModalContent({ mode, initialData, onClose }: Omit<Props, "isOpen">) {
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        number: initialData?.number ?? "",
        floor: initialData ? String(initialData.floor) : "",
        roomTypeId: initialData?.roomTypeId ?? (null as number | null),
        isAvailable: initialData?.isAvailable ?? true,
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const createMutation = useCreateRoom();
    const updateMutation = useUpdateRoom();
    const changeAvailabilityMutation = useChangeAvailability();

    const {
        data: roomTypesData,
        isLoading: isLoadingTypes,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteRoomTypes({
        pageSize: 10,
        search: "",
        sortBy: "Name:asc",
    });

    const allRoomTypes = roomTypesData?.pages.flatMap((p) => p.items).filter(Boolean) || [];
    const selectedTypeName = allRoomTypes.find((t) => t.id === formData.roomTypeId)?.name || null;

    const observerRef = useRef<IntersectionObserver | null>(null);

    const typeDropdownTriggerRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) observerRef.current.disconnect();
            if (!node) return;

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                        void fetchNextPage();
                    }
                },
                { threshold: 0.3, root: node.closest(".modal-type-dropdown") }
            );
            observerRef.current.observe(node);
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    const handleSubmit = async () => {
        if (!formData.roomTypeId) return;

        if (mode === "create") {
            await createMutation.mutateAsync({
                number: formData.number,
                floor: Number(formData.floor),
                roomTypeId: formData.roomTypeId,
            });
        } else if (initialData) {
            await updateMutation.mutateAsync({
                id: initialData.id,
                data: {
                    number: formData.number,
                    floor: Number(formData.floor),
                    roomTypeId: formData.roomTypeId,
                    id: initialData.id,
                },
            });

            if (formData.isAvailable !== initialData.isAvailable) {
                await changeAvailabilityMutation.mutateAsync({
                    id: initialData.id,
                    isAvailable: formData.isAvailable,
                });
            }
        }
        onClose();
    };

    const isPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        changeAvailabilityMutation.isPending;

    const isValid =
        formData.number.trim() !== "" &&
        formData.floor.trim() !== "" &&
        formData.roomTypeId !== null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {mode === "create" ? t("roomModal.addTitle") : t("roomModal.editTitle")}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{t("roomModal.roomNumber")}</label>
                    <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                        placeholder={t("roomModal.roomNumberPlaceholder")}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{t("roomModal.floor")}</label>
                    <input
                        type="number"
                        value={formData.floor}
                        onChange={(e) => setFormData((prev) => ({ ...prev, floor: e.target.value }))}
                        placeholder={t("roomModal.floorPlaceholder")}
                        min={1}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                        {t("roomModal.roomType")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full px-4 py-2 border rounded-lg bg-white text-left flex justify-between items-center transition-colors ${
                                formData.roomTypeId
                                    ? "border-gray-300 hover:border-gray-400"
                                    : "border-red-300 hover:border-red-400"
                            } focus:outline-none`}
                        >
                            <span className={selectedTypeName ? "text-gray-900" : "text-gray-400"}>
                                {selectedTypeName ?? t("roomModal.selectRoomType")}
                            </span>
                            <svg
                                className={`w-5 h-5 transition-transform text-gray-500 ${
                                    isDropdownOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div
                                className="modal-type-dropdown absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {isLoadingTypes && (
                                    <div className="px-4 py-3 text-gray-500 text-sm">{t("roomModal.loadingTypes")}</div>
                                )}
                                {allRoomTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, roomTypeId: type.id }));
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex justify-between items-center ${
                                            formData.roomTypeId === type.id ? "bg-blue-50 text-blue-600" : ""
                                        }`}
                                    >
                                        <span>{type.name}</span>
                                        <span className="text-xs text-gray-400">{type.basePrice}{t("roomModal.perNight")}</span>
                                    </button>
                                ))}
                                <div ref={typeDropdownTriggerRef} className="py-1 text-center">
                                    {isFetchingNextPage && (
                                        <div className="text-xs text-gray-400 py-1">{t("roomModal.loadingMore")}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {!formData.roomTypeId && (
                        <p className="text-xs text-red-500">{t("roomModal.roomTypeRequired")}</p>
                    )}
                </div>

                {mode === "edit" && (
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">{t("roomModal.availability")}</label>
                        <div className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg">
                            <span className="text-sm text-gray-500">
                                {formData.isAvailable ? t("roomModal.availableForBooking") : t("roomModal.notAvailable")}
                            </span>
                            <button
                                onClick={() =>
                                    setFormData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    formData.isAvailable ? "bg-green-500" : "bg-gray-300"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        formData.isAvailable ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {t("roomModal.cancel")}
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={!isValid || isPending}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending
                            ? (mode === "create" ? t("roomModal.creating") : t("roomModal.saving"))
                            : (mode === "create" ? t("roomModal.createRoom") : t("roomModal.saveChanges"))}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RoomModal({ isOpen, mode, initialData, onClose }: Props) {
    if (!isOpen) return null;

    const key = mode === "create" ? "create" : `edit-${initialData?.id}`;

    return <RoomModalContent key={key} mode={mode} initialData={initialData} onClose={onClose} />;
}

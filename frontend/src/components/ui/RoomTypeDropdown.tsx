// components/ui/RoomTypeDropdown.tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInfiniteRoomTypes } from "../../features/roomType/useRoomTypes.ts";

interface Props {
    selectedTypeId: number | null;
    onTypeSelect: (typeId: number | null) => void;
    onAddRoomType: () => void;
    onEditRoomType: (typeId: number) => void;
    onDeleteRoomType: (typeId: number) => void;
}

export default function RoomTypeDropdown({
                                             selectedTypeId,
                                             onTypeSelect,
                                             onAddRoomType,
                                             onEditRoomType,
                                             onDeleteRoomType,
                                         }: Props) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const {
        data: roomTypesData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteRoomTypes({
        pageSize: 10,
        search: debouncedSearch,
        sortBy: "Name:asc",
    });

    const roomTypes = roomTypesData?.pages.flatMap((page) => page.items) ?? [];

    const allTypesLabel = t("priceCalendar.selectRoomType").replace(/^—\s*/, "").replace(/\s*—$/, "").trim();

    const selectedTypeName =
        selectedTypeId === null
            ? allTypesLabel
            : roomTypes.find((t) => t.id === selectedTypeId)?.name || "—";

    const observerRef = useRef<IntersectionObserver | null>(null);

    const triggerRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            if (!node) return;

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                        void fetchNextPage();
                    }
                },
                {
                    threshold: 0.3,
                    root: node.closest(".dropdown-scroll-container"),
                }
            );

            observerRef.current.observe(node);
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    const handleTypeSelect = (typeId: number | null) => {
        onTypeSelect(typeId);
        setSearch(typeId === null ? "" : roomTypes.find((t) => t.id === typeId)?.name ?? "");
        setIsOpen(false);
    };

    return (
        <div className="relative w-64">
            <input
                type="text"
                value={isOpen ? search : selectedTypeName}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => {
                    setSearch("");
                    setIsOpen(true);
                }}
                placeholder={t("roomsAdmin.searchPlaceholder")}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none bg-white"
            />
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 bg-white"
            >
                <svg className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="dropdown-scroll-container hide-scrollbar absolute top-full mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {/* All Room Types */}
                    <div className="p-1">
                        <button
                            onClick={() => handleTypeSelect(null)}
                            className={`w-full px-3 py-2 text-left rounded-md flex justify-between items-center transition-colors ${
                                selectedTypeId === null
                                    ? "bg-blue-50 text-blue-600"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            <span>{t("common.all")}</span>
                        </button>
                    </div>

                    {/* Add Room Type */}
                    <div className="px-1 pb-1">
                        <button
                            onClick={() => {
                                onAddRoomType();
                                setIsOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left rounded-md hover:bg-green-50 text-green-600 flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{t("roomTypeModal.addTitle")}</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="mx-2 border-t border-gray-100" />

                    {/* Loading */}
                    {isLoading && (
                        <div className="px-4 py-2 text-gray-500 text-sm">{t("roomModal.loadingTypes")}</div>
                    )}

                    {/* Room Types List */}
                    <div className="p-1">
                        {roomTypes.map((type) => (
                            <div
                                key={type.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                                    selectedTypeId === type.id
                                        ? "bg-blue-50 text-blue-600"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                <button
                                    onClick={() => handleTypeSelect(type.id)}
                                    className="flex-1 text-left text-sm"
                                >
                                    {type.name}
                                </button>

                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditRoomType(type.id);
                                        }}
                                        className="p-1 hover:bg-blue-100 rounded-md transition-colors"
                                        title={t("common.edit")}
                                    >
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteRoomType(type.id);
                                        }}
                                        className="p-1 hover:bg-red-100 rounded-md transition-colors"
                                        title={t("common.delete")}
                                    >
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Infinite scroll trigger */}
                    <div ref={triggerRef} className="py-1 text-center">
                        {isFetchingNextPage && (
                            <div className="text-xs text-gray-400 py-1">{t("common.loadingMore")}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

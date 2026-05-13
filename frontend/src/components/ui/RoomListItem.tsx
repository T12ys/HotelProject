import { useTranslation } from "react-i18next";
import { useRoomType } from "../../features/roomType/useRoomTypes.ts";
import type { RoomResponseDto } from "../../features/room/roomTypes.ts";

interface Props {
    room: RoomResponseDto;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    isDeleting: boolean;
}

export default function RoomListItem({ room, onEdit, onDelete, isDeleting }: Props) {
    const { t } = useTranslation();
    const { data: roomType, isLoading: isLoadingType } = useRoomType(room.roomTypeId);

    return (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Room {room.number}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        room.isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}>
                        {room.isAvailable ? t("roomsAdmin.available") : t("roomsAdmin.unavailable")}
                    </span>
                    {isLoadingType ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
                            {t("common.loading")}
                        </span>
                    ) : roomType ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                            {roomType.name}
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span>{t("roomsAdmin.floor", { number: room.floor })}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(room.id)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                    {t("common.edit")}
                </button>
                <button
                    onClick={() => onDelete(room.id)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                    {t("common.delete")}
                </button>
            </div>
        </div>
    );
}
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePriceCalculation } from "../../features/priceRule/usePriceRule.ts";

export interface RoomScrollerItem {
    id: number;
    label: string;
    imageUrl?: string;
    desc: string;
}

interface Props {
    items: RoomScrollerItem[];
}

function RoomScrollerCard({ item }: { item: RoomScrollerItem }) {
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = today.toISOString().split("T")[0];
    const endDate   = tomorrow.toISOString().split("T")[0];

    const { data: priceData } = usePriceCalculation({ roomTypeId: item.id, startDate, endDate });
    const price = priceData ? `${Math.round(priceData.finalTotalPrice)}₼/ночь` : "—";

    return (
        <Link
            to={`/rooms/${item.id}`}
            className="shrink-0 snap-start rounded-2xl overflow-hidden relative border border-stone-200
                       transition-all duration-300
                       hover:shadow-md
                       hover:-translate-y-px"
            style={{ width: "280px", height: "320px" }}
        >
            {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 bg-amber-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
                <span className="font-bold text-white text-xl">
                    {item.label}
                </span>
                <span className="text-sm text-white/80 line-clamp-2">{item.desc}</span>
                <span className="text-sm text-amber-300 font-semibold mt-1">{price}</span>
            </div>
        </Link>
    );
}

export default function RoomScroller({ items }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const style = document.createElement("style");
        style.textContent = `[data-room-scroller]::-webkit-scrollbar { display: none; }`;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const scrollTo = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const card = scrollRef.current.firstElementChild as HTMLElement;
        if (!card) return;
        scrollRef.current.scrollBy({
            left: direction === "right" ? card.offsetWidth + 20 : -(card.offsetWidth + 20),
            behavior: "smooth",
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                    {(["left", "right"] as const).map((dir) => (
                        <button
                            key={dir}
                            onClick={() => scrollTo(dir)}
                            className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow
                                       transition-all duration-300
                                       hover:shadow-md
                                       hover:-translate-y-px"
                        >
                            {dir === "left" ? "←" : "→"}
                        </button>
                    ))}
                </div>
            </div>
            <div
                ref={scrollRef}
                data-room-scroller=""
                className="flex gap-5 py-2 overflow-x-auto snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
                {items.map((item) => (
                    <RoomScrollerCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
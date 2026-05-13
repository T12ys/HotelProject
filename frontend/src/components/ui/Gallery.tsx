import { useState } from "react";

interface GallerySlide {
    id: number;
    label: string;
    imageUrl?: string;
}

interface Props {
    slides: GallerySlide[];
}

export default function Gallery({ slides }: Props) {
    const [current, setCurrent] = useState(0);

    const prev = () => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
    const next = () => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));

    if (!slides.length) return null;

    const slide = slides[current];

    return (
        <div className="relative rounded-2xl overflow-hidden h-[480px] flex items-center justify-center bg-stone-100 shadow-inner">
            {slide.imageUrl ? (
                <img
                    src={slide.imageUrl}
                    alt={slide.label}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500"
                />
            ) : (
                <div className="absolute inset-0 bg-stone-200 transition-all duration-500" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            <span className="absolute bottom-12 left-0 right-0 text-center text-white font-semibold text-2xl drop-shadow z-10">{slide.label}</span>

            <button
                onClick={prev}
                className="absolute left-3 z-10 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-xl
                           transition-all duration-300
                           hover:shadow-md
                           hover:-translate-y-px"
            >
                ←
            </button>
            <button
                onClick={next}
                className="absolute right-3 z-10 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-xl
                           transition-all duration-300
                           hover:shadow-md
                           hover:-translate-y-px"
            >
                →
            </button>

            <div className="absolute bottom-4 flex gap-1.5 z-10">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition ${i === current ? "bg-amber-500" : "bg-white/60"}`}
                    />
                ))}
            </div>
        </div>
    );
}
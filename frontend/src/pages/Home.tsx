import Gallery from "../components/ui/Gallery.tsx";
import RoomScroller from "../components/ui/RoomScroller.tsx";
import type { RoomScrollerItem } from "../components/ui/RoomScroller.tsx";
import { SERVICE_ICONS } from "./home_data";
import { useRoomTypes } from "../features/roomType/useRoomTypes.ts";
import { useDiscountedRoomTypes } from "../features/priceRule/usePriceRule.ts";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";


function ServiceCard({ icon, label, description }: { icon: string; label: string; description: string }) {
    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-amber-200 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            </div>
            <div>
                <p className="font-semibold text-stone-800 text-base leading-tight">
                    {label}
                </p>
                <p className="text-stone-500 text-sm mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function HoverLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className={[
                className,
                "transition-all duration-300",
                "hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)]",
                "hover:-translate-y-px",
            ].filter(Boolean).join(" ")}
        >
            {children}
        </Link>
    );
}

export default function Home() {
    const { t } = useTranslation();

    const { data: roomTypesData, isLoading: loadingGallery } = useRoomTypes({
        page: 1, pageSize: 10, isActive: true, sortBy: "basePrice:desc",
    });

    const { data: discountedData, isLoading: loadingDiscounted } = useDiscountedRoomTypes(1, 10);

    const gallerySlides = (roomTypesData?.items ?? []).map((rt) => ({
        id: rt.id, label: rt.name, imageUrl: rt.photos[0]?.url,
    }));

    const discountedItems = discountedData?.items ?? [];
    const fallbackItems   = roomTypesData?.items ?? [];
    const hasDiscounts    = discountedItems.length > 0;

    const specialRooms: RoomScrollerItem[] = (hasDiscounts ? discountedItems : fallbackItems).map((rt) => ({
        id: rt.id, label: rt.name, imageUrl: rt.photos[0]?.url, desc: rt.description,
    }));
    const services = (t("home.services", { returnObjects: true }) as { label: string; description: string }[]);

    return (
        <div className="flex flex-col gap-12 py-4">

            {/* Gallery */}
            <section>
                {loadingGallery ? (
                    <div className="h-[480px] rounded-2xl bg-stone-100 animate-pulse" />
                ) : (
                    <Gallery slides={gallerySlides} />
                )}
            </section>

            {/* About */}
            <section className="flex gap-10 items-center">
                <div className="flex-1 flex flex-col gap-4">
                    <h2 className="text-3xl font-bold text-stone-800">
                        {t("home.welcome")}
                    </h2>
                    <p className="text-stone-600 leading-relaxed">{t("home.welcomeDesc")}</p>
                    <HoverLink
                        to="/rooms"
                        className="w-fit mt-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium"
                    >
                        {t("home.browseRooms")}
                    </HoverLink>
                </div>

                <div className="shrink-0 grid grid-cols-2 gap-3 w-64">
                    {[
                        { value: "150+", label: t("home.stats.rooms") },
                        { value: "24/7", label: t("home.stats.support") },
                        { value: "4.9★", label: t("home.stats.rating") },
                        { value: "10+",  label: t("home.stats.experience") },
                    ].map(({ value, label }) => (
                        <div key={label} className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-1 text-center">
                <span className="font-bold text-stone-800 text-2xl">
                    {value}
                </span>
                            <span className="text-stone-500 text-xs">{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Special offers */}
            <section>
                <div className="flex items-baseline gap-3 mb-4">
                    <h2  className="text-2xl font-bold text-stone-800">
                        {hasDiscounts ? t("home.specialOffers") : t("home.premiumRooms")}
                    </h2>
                    {hasDiscounts && (
                        <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                            {t("home.discountBadge")}
                        </span>
                    )}
                </div>
                {loadingDiscounted || loadingGallery ? (
                    <div className="h-48 rounded-2xl bg-stone-100 animate-pulse" />
                ) : specialRooms.length === 0 ? (
                    <p className="text-stone-400 text-sm py-8 text-center">{t("home.noRoomsAvailable")}</p>
                ) : (
                    <RoomScroller items={specialRooms} />
                )}
            </section>

            {/* Services */}
            <section>
                <h2  className="text-2xl font-bold text-stone-800 mb-1">
                    {t("home.ourServices")}
                </h2>
                <p className="text-stone-500 text-sm mb-5">{t("home.servicesSubtitle")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {services.map((s, i) => (
                        <ServiceCard key={s.label} icon={SERVICE_ICONS[i]} label={s.label} description={s.description} />
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                <h2  className="text-2xl font-bold text-white">
                    {t("home.ctaTitle")}
                </h2>
                <p className="text-stone-400 text-sm max-w-md">{t("home.ctaDesc")}</p>
                <HoverLink
                    to="/rooms"
                    className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-8 py-3 font-medium"
                >
                    {t("home.ctaButton")}
                </HoverLink>
            </section>
        </div>
    );
}
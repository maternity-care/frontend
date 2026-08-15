"use client";

import { useEffect, useRef, useState } from "react";
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
} from "lucide-react";
import {
    Button,
    Card,
    Carousel,
    Empty,
    Skeleton,
    Tag,
    Typography,
} from "antd";

import type {
    BackendOperatingHour,
    Facility,
    FacilityOperatingStatus,
} from "@/management/features/facilities/facilities.types";
import { getPublicFacilities } from "@/management/features/facilities/facilities.api";
import { CarouselRef } from "antd/es/carousel";

const { Title, Paragraph, Text } = Typography;

type OperatingStatusMeta = {
    label: string;
    className: string;
};

const OPERATING_STATUS_META: Partial<
    Record<FacilityOperatingStatus, OperatingStatusMeta>
> = {
    OPEN: {
        label: "Đang mở cửa",
        className:
            "!border-emerald-200 !bg-emerald-50 !text-emerald-700",
    },
    CLOSED: {
        label: "Đã đóng cửa",
        className: "!border-slate-200 !bg-slate-100 !text-slate-600",
    },
    TEMPORARILY_CLOSED: {
        label: "Tạm ngừng hoạt động",
        className: "!border-amber-200 !bg-amber-50 !text-amber-700",
    },
};

function getOperatingStatusMeta(
    facility: Facility,
): OperatingStatusMeta {
    if (facility.isOpenNow) {
        return {
            label: "Đang mở cửa",
            className:
                "!border-emerald-200 !bg-emerald-50 !text-emerald-700",
        };
    }

    return (
        OPERATING_STATUS_META[facility.operatingStatus] ?? {
            label: facility.operatingStatusLabel || "Đã đóng cửa",
            className:
                "!border-slate-200 !bg-slate-100 !text-slate-600",
        }
    );
}

function getTodayWorkingHours(facility: Facility): string {
    const today = facility.todayOperatingHour as
        | (BackendOperatingHour & {
            openTime?: string;
            closeTime?: string;
            isClosed?: boolean;
        })
        | null;

    if (!today) {
        return facility.workingHours || "Chưa cập nhật";
    }

    if (today.isClosed) {
        return "Nghỉ hôm nay";
    }

    if (today.openTime && today.closeTime) {
        return `${today.openTime} - ${today.closeTime}`;
    }

    return facility.workingHours || "Chưa cập nhật";
}

function createMapUrl(facility: Facility): string {
    const query =
        facility.latitude && facility.longitude
            ? `${facility.latitude},${facility.longitude}`
            : [
                facility.address,
                facility.ward,
                facility.city,
            ]
                .filter(Boolean)
                .join(", ");

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query,
    )}`;
}

function FacilityCardSkeleton() {
    return (
        <div className="px-2.5 pb-5">
            <Card className="h-full !rounded-3xl !border-pink-100">
                <Skeleton active paragraph={{ rows: 7 }} />
            </Card>
        </div>
    );
}

export function FacilityTab() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef<CarouselRef>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadFacilities() {
            try {
                setLoading(true);

                const response = await getPublicFacilities({
                    limit: 5,
                });

                if (!cancelled) {
                    setFacilities(Array.isArray(response) ? response : []);
                }
            } catch (error) {
                console.error("Failed to load facilities:", error);

                if (!cancelled) {
                    setFacilities([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadFacilities();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="space-y-4">
            <header className="text-center">

                <Title level={2} className="!mb-3 !text-slate-950">
                    Hệ thống cơ sở
                </Title>

                <Paragraph className="mx-auto max-w-2xl !text-base !leading-4 !text-slate-600">
                    Lựa chọn cơ sở thuận tiện và phù hợp với địa chỉ của mình
                </Paragraph>

                <Text className="!text-sm !text-slate-400">
                    Vuốt hoặc cuộn ngang để xem các cơ sở
                </Text>
            </header>

            {loading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <FacilityCardSkeleton key={index} />
                    ))}
                </div>
            ) : facilities.length === 0 ? (
                <Empty
                    description="Hiện chưa có thông tin cơ sở"
                    className="py-16"
                />
            ) : (
                <div className="relative">
                    <Carousel
                        ref={carouselRef}
                        autoplay
                        autoplaySpeed={2000}
                        speed={600}
                        pauseOnHover
                        draggable
                        swipeToSlide
                        infinite={facilities.length > 1}
                        slidesToShow={3}
                        slidesToScroll={1}
                        dots={{ className: "!relative !mt-3" }}
                        responsive={[
                            {
                                breakpoint: 1280,
                                settings: { slidesToShow: 2 },
                            },
                            {
                                breakpoint: 768,
                                settings: { slidesToShow: 1 },
                            },
                        ]}
                        className="facility-carousel -mx-2.5"
                    >
                        {facilities.map((facility) => {
                            const status = getOperatingStatusMeta(facility);
                            const mapUrl = createMapUrl(facility);

                            return (
                                <article
                                    key={facility.id}
                                    className="h-full px-2.5 pb-5"
                                >
                                    <Card
                                        className="
                    group h-full overflow-hidden
                    !rounded-3xl !border-pink-100
                    transition-all duration-300
                    hover:-translate-y-1 hover:!border-pink-200
                    hover:!shadow-xl hover:!shadow-pink-100/70
                  "
                                        styles={{
                                            body: {
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                padding: 24,
                                            },
                                        }}
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                                                <Building2 className="h-6 w-6" />
                                            </div>

                                            <Tag
                                                className={`!m-0 !rounded-full !px-3 !py-1 ${status.className}`}
                                            >
                                                <span className="inline-flex items-center gap-1.5">
                                                    {facility.isOpenNow && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    )}

                                                    {status.label}
                                                </span>
                                            </Tag>
                                        </div>

                                        <div className="mb-4">
                                            {/* <Text className="!text-xs !font-semibold !uppercase !tracking-wider !text-pink-500">
                                                {facility.code}
                                            </Text> */}

                                            <Title
                                                level={4}
                                                className="!mb-1 !mt-1 !text-slate-950"
                                            >
                                                {facility.name}
                                            </Title>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />

                                                <div>
                                                    <Text className="block !font-medium !text-slate-800">
                                                        Địa chỉ
                                                    </Text>

                                                    <Text className="!leading-6 !text-slate-500">
                                                        {[
                                                            facility.address,
                                                            facility.ward,
                                                            facility.city,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ")}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />

                                                <div>
                                                    <Text className="block !font-medium !text-slate-800">
                                                        Giờ làm việc hôm nay
                                                    </Text>

                                                    <Text
                                                        className={
                                                            facility.isOpenNow
                                                                ? "!font-medium !text-emerald-600"
                                                                : "!text-slate-500"
                                                        }
                                                    >
                                                        {getTodayWorkingHours(facility)}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />

                                                <div>
                                                    <Text className="block !font-medium !text-slate-800">
                                                        Hotline
                                                    </Text>

                                                    <a
                                                        href={`tel:${facility.hotline}`}
                                                        className="font-medium text-pink-600 hover:text-pink-700"
                                                    >
                                                        {facility.hotline}
                                                    </a>
                                                </div>
                                            </div>

                                            {facility.email && (
                                                <div className="flex items-start gap-3">
                                                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />

                                                    <div className="min-w-0">
                                                        <Text className="block !font-medium !text-slate-800">
                                                            Email
                                                        </Text>

                                                        <a
                                                            href={`mailto:${facility.email}`}
                                                            className="break-all text-slate-500 hover:text-pink-600"
                                                        >
                                                            {facility.email}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                                            <Button
                                                size="large"
                                                href={`tel:${facility.hotline}`}
                                                icon={<Phone className="h-4 w-4" />}
                                                className="!h-11 !rounded-xl"
                                            >
                                                Gọi ngay
                                            </Button>

                                            <Button
                                                type="primary"
                                                size="large"
                                                href={mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                icon={<ExternalLink className="h-4 w-4" />}
                                                className="
                        !h-11 !rounded-xl
                        !border-pink-500 !bg-pink-500
                        hover:!border-pink-600 hover:!bg-pink-600
                      "
                                            >
                                                Chỉ đường
                                            </Button>
                                        </div>
                                    </Card>
                                </article>
                            );
                        })}
                    </Carousel>
                    {facilities.length > 1 && (
                        <>
                            <Button
                                type="text"
                                shape="circle"
                                aria-label="Xem cơ sở trước"
                                icon={<ChevronLeft className="h-6 w-6" />}
                                onClick={() => carouselRef.current?.prev()}
                                className="
                                    !absolute !left-1 !top-1/2 !z-20
                                    !flex !h-11 !w-11 !-translate-y-1/2
                                    !items-center !justify-center
                                    !border !border-pink-100 !bg-white/95
                                    !text-pink-600 !shadow-lg
                                    hover:!border-pink-200 hover:!bg-pink-50
                                    md:!-left-4
                                    "
                            />

                            <Button
                                type="text"
                                shape="circle"
                                aria-label="Xem cơ sở tiếp theo"
                                icon={<ChevronRight className="h-6 w-6" />}
                                onClick={() => carouselRef.current?.next()}
                                className="
                                    !absolute !right-1 !top-1/2 !z-20
                                    !flex !h-11 !w-11 !-translate-y-1/2
                                    !items-center !justify-center
                                    !border !border-pink-100 !bg-white/95
                                    !text-pink-600 !shadow-lg
                                    hover:!border-pink-200 hover:!bg-pink-50
                                    md:!-right-4
                                    "
                            />
                        </>
                    )}
                </div>
            )
            }
        </section >
    );
}
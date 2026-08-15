"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Carousel,
  Empty,
  Select,
  Skeleton,
  Tag,
  Typography,
  message,
} from "antd";
import type { CarouselRef } from "antd/es/carousel";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hospital,
  Package,
} from "lucide-react";

import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { getPublicFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import type { MaternityPackage } from "@/management/features/services/public-service-packages/maternity-packages.types";
import { getPublicMaternityPackages } from "@/management/features/services/public-service-packages/maternity-packages.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { useCartStore } from "@/features/cart/cart.store";

const { Title, Paragraph, Text } = Typography;

function formatPrice(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${num.toLocaleString("vi-VN")}đ`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function PackageCardSkeleton() {
  return (
    <div className="px-2.5 pb-5">
      <Card className="h-full !rounded-3xl !border-pink-100">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  );
}

export function PackagesTab() {
  const router = useRouter();
  const { user, refreshToken } = useAuthStore();
  const isLoggedIn = Boolean(user || refreshToken);
  const addItem = useCartStore((s) => s.addItem);
  const carouselRef = useRef<CarouselRef>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState<string>("1");
  const [packages, setPackages] = useState<MaternityPackage[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cơ sở
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getPublicFacilities({ status: "active", limit: 50 });
        if (!cancelled) {
          setFacilities(data);
          const hasDefault = data.some((f) => f.id === "1");
          if (!hasDefault && data.length > 0) {
            setFacilityId(data[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Không tải được danh sách cơ sở."));
        }
      } finally {
        if (!cancelled) setLoadingFacilities(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load gói theo cơ sở
  useEffect(() => {
    if (!facilityId) return;

    let cancelled = false;

    (async () => {
      setLoadingPackages(true);
      setError(null);

      try {
        const data = await getPublicMaternityPackages({
          facilityId,
          status: "active",
          limit: 50,
        });
        if (!cancelled) setPackages(data);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Không tải được gói thai sản."));
          setPackages([]);
        }
      } finally {
        if (!cancelled) setLoadingPackages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  const displayedPackages = facilityId ? packages : [];
  const selectedFacility = facilities.find((f) => f.id === facilityId);

  const handleRegisterPackage = (pkg: MaternityPackage) => {
    if (!facilityId) {
      message.warning("Vui lòng chọn cơ sở trước");
      return;
    }

    addItem({
      packageId: pkg.id,
      packageName: pkg.name,
      packageCode: pkg.code,
      facilityId,
      facilityName: selectedFacility?.name,
      price: Number(pkg.price) || 0,
      durationDays: pkg.durationDays,
    });

    message.success(`Đã thêm "${pkg.name}" vào giỏ hàng`);

    if (!isLoggedIn) {
      router.push("/login?redirect=/#dich-vu");
      return;
    }

    router.push("/checkout");
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="text-center">
        <Title level={2} className="!mb-3 !text-slate-950">
          Gói thai sản
        </Title>
        <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-slate-600">
          Chọn cơ sở trước để xem các gói chăm sóc thai kỳ đang áp dụng tại cơ
          sở đó.
        </Paragraph>
        <Text className="!text-sm !text-slate-400">
          Vuốt hoặc cuộn ngang để xem các gói
        </Text>
      </header>

      <div className="flex justify-center">
        <Card
          className="w-full max-w-xl !rounded-3xl !border-pink-100 !shadow-sm"
          styles={{ body: { padding: 20 } }}
        >
          <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-pink-700">
            <Hospital className="h-4 w-4" />
            Chọn cơ sở
          </div>

          <Select
            size="large"
            showSearch
            className="w-full"
            loading={loadingFacilities}
            placeholder="Chọn cơ sở để xem gói thai sản"
            optionFilterProp="label"
            value={facilityId}
            onChange={(value) => {
              setFacilityId(value);
              setError(null);
            }}
            options={facilities.map((facility) => ({
              value: facility.id,
              label: `${facility.name}${
                facility.city || facility.address
                  ? ` - ${facility.city || facility.address}`
                  : ""
              }`,
            }))}
          />
        </Card>
      </div>

      {error ? (
        <Alert
          type="warning"
          showIcon
          title={error}
          closable
          onClose={() => setError(null)}
        />
      ) : null}

      {!facilityId ? (
        <Card className="!rounded-3xl !border-dashed !border-pink-200 bg-white/60">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Vui lòng chọn cơ sở để xem gói thai sản"
          />
        </Card>
      ) : loadingPackages ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PackageCardSkeleton key={index} />
          ))}
        </div>
      ) : displayedPackages.length === 0 ? (
        <Card className="!rounded-3xl !border-dashed !border-pink-200 bg-white/60">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Cơ sở này chưa có gói thai sản khả dụng"
          />
        </Card>
      ) : (
        <div className="relative">
          <Carousel
            ref={carouselRef}
            autoplay
            autoplaySpeed={3500}
            speed={600}
            pauseOnHover
            draggable
            swipeToSlide
            infinite={displayedPackages.length > 1}
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
            className="package-carousel -mx-2.5"
          >
            {displayedPackages.map((item, index) => {
              const isHighlight = index === 0;

              return (
                <article key={item.id} className="h-full px-2.5 pb-5">
                  <Card
                    className={[
                      "group h-full overflow-hidden !rounded-3xl transition-all duration-300",
                      "hover:-translate-y-1 hover:!shadow-xl hover:!shadow-pink-100/70",
                      isHighlight
                        ? "!border-pink-400 !shadow-lg !shadow-pink-100"
                        : "!border-pink-100 hover:!border-pink-200",
                    ].join(" ")}
                    styles={{
                      body: {
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        padding: 24,
                      },
                    }}
                  >
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                        <Package className="h-6 w-6" />
                      </div>

                      <Tag
                        color={isHighlight ? "magenta" : "pink"}
                        className="!m-0 !rounded-full !px-3 !py-1"
                      >
                        {item.packageType === "schedule"
                          ? "Theo lịch"
                          : "Theo số lượt"}
                      </Tag>
                    </div>

                    <div className="mb-3">
                      {/* {item.code ? (
                        <Text className="!text-xs !font-semibold !uppercase !tracking-wider !text-pink-500">
                          {item.code}
                        </Text>
                      ) : null} */}

                      <Title
                        level={4}
                        className="!mb-0 !mt-1 !line-clamp-2 !text-slate-950"
                        title={item.name}
                      >
                        {item.name}
                      </Title>
                    </div>

                    <div className="mb-3">
                      <Text className="!text-2xl !font-bold !text-pink-600">
                        {formatPrice(item.price)}
                      </Text>
                      <div className="mt-0.5 text-sm text-slate-500">
                        Thời hạn: {item.durationDays} ngày
                      </div>
                    </div>

                    {/* Mô tả */}
                    <Paragraph className="!mb-4 !line-clamp-3 !text-sm !leading-6 !text-slate-600 break-words">
                      {item.description ||
                        "Chưa có mô tả chi tiết cho gói này."}
                    </Paragraph>

                    {/* Danh sách dịch vụ */}
                    <div className="mb-5 flex flex-1 flex-col gap-2">
                      {item.services && item.services.length > 0 ? (
                        item.services.slice(0, 5).map((s, idx) => {
                          const label = `${s.serviceName}${
                            s.includedQuantity > 1
                              ? ` (x${s.includedQuantity})`
                              : ""
                          }`;

                          return (
                            <div
                              key={`${item.id}-${s.id ?? s.serviceId ?? idx}`}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                              <span className="line-clamp-2 break-words">
                                {label}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-start gap-2 text-sm text-slate-400">
                          <Package className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Chưa có dịch vụ chi tiết</span>
                        </div>
                      )}
                    </div>

                    {/* Nút đăng ký */}
                    <div className="mt-auto border-t border-slate-100 pt-5">
                      <Button
                        type={isHighlight ? "primary" : "default"}
                        block
                        size="large"
                        className={[
                          "!h-11 !rounded-xl !font-semibold",
                          isHighlight
                            ? "!border-pink-500 !bg-pink-500 hover:!border-pink-600 hover:!bg-pink-600"
                            : "!border-pink-200 !text-pink-600 hover:!border-pink-300 hover:!text-pink-700",
                        ].join(" ")}
                        onClick={() => handleRegisterPackage(item)}
                      >
                        {RESPONSE_MESSAGES.HOME?.PACKAGES_SECTION
                          ?.REGISTER_PACKAGE ?? "Đăng ký gói"}
                      </Button>
                    </div>
                  </Card>
                </article>
              );
            })}
          </Carousel>

          {/* Nút prev / next */}
          {displayedPackages.length > 1 && (
            <>
              <Button
                type="text"
                shape="circle"
                aria-label="Xem gói trước"
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
                aria-label="Xem gói tiếp theo"
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
      )}
    </section>
  );
}
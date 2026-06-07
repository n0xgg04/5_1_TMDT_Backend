"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Wifi,
  CheckCircle,
  ChevronLeft,
  Share2,
  Heart,
  ArrowUp,
  MessageSquare,
  Clock,
  FileText,
  Navigation,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import {
  AvailabilityLegend,
  SectionHeading,
  hotelFallbackImage,
} from "@/components/hotel/commercial";
import {
  BookingConflictDialog,
  type BookingConflictDialogData,
} from "@/components/booking/booking-conflict-dialog";
import { toast } from "@/lib/toast";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import type {
  Review,
  HotelBranch,
  RoomTypeAvailabilityResponse,
  RangeAvailabilityResponse,
} from "@/lib/types";

interface RoomTypeDetail {
  id: string;
  name: string;
  description?: string | null;
  maxGuests: number;
  areaSqm: number;
  bedType: string;
  amenities: string[];
  images: string[];
  starRating?: number;
  policies?: Record<string, string>;
  popularFacilities?: string[];
  distanceToCenter?: string;
  nearbyPoints?: string[];
  faqs?: { question: string; answer: string }[];
  totalRooms?: number;
  numFloors?: number;
  isActive: boolean;
  rooms: ({
    branch: HotelBranch;
  } & {
    id: string;
    roomNumber: string;
    floor: number;
    roomTypeId: string;
    status: string;
    notes?: string | null;
  })[];
  pricingRules: { pricePerNight: number }[];
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
  similarRooms: {
    id: string;
    name: string;
    images: string[];
    pricePerNight: number;
    branch?: HotelBranch;
    starRating?: number;
  }[];
  isSaved: boolean;
}

type TabKey = "overview" | "rooms" | "location" | "policy" | "reviews";

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Tổng quan",
  rooms: "Lựa chọn phòng",
  location: "Vị trí",
  policy: "Chính sách",
  reviews: "Đánh giá",
};

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDaysISO(date: string, days: number) {
  const next = parseISODate(date);
  next.setDate(next.getDate() + days);
  return toISODate(next);
}

function defaultStayDates() {
  const today = toISODate(new Date());
  return { checkIn: today, checkOut: addDaysISO(today, 1) };
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("overview");
  const [showBackTop, setShowBackTop] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [stayDates, setStayDates] = useState(defaultStayDates);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [conflictDialog, setConflictDialog] =
    useState<BookingConflictDialogData | null>(null);

  const q = useQuery({
    queryKey: ["room-detail", id],
    enabled: !!id,
    queryFn: () =>
      api.get<RoomTypeDetail>(`/rooms/types/${id}/public`).then((r) => r.data),
  });

  const calendarTo = addDaysISO(stayDates.checkIn, 30);
  const availabilityQ = useQuery({
    queryKey: [
      "room-type-availability",
      id,
      stayDates.checkIn,
      calendarTo,
    ],
    enabled: !!id && !!stayDates.checkIn,
    queryFn: () =>
      api
        .get<RoomTypeAvailabilityResponse>("/availability/room-type", {
          params: {
            roomTypeId: id,
            from: stayDates.checkIn,
            to: calendarTo,
          },
        })
        .then((r) => r.data),
  });

  const saveM = useMutation({
    mutationFn: () =>
      api.post("/wishlist", { roomTypeId: id }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã lưu phòng");
      qc.invalidateQueries({ queryKey: ["room-detail", id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const unsaveM = useMutation({
    mutationFn: () => api.delete(`/wishlist/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã bỏ lưu phòng");
      qc.invalidateQueries({ queryKey: ["room-detail", id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const canReviewQ = useQuery({
    queryKey: ["can-review", id],
    enabled: !!id && !!user,
    queryFn: () =>
      api
        .get<{
          canReview: boolean;
          bookingId: string | null;
        }>(`/reviews/can-review/${id}`)
        .then((r) => r.data),
  });

  const reviewM = useMutation({
    mutationFn: ({
      bookingId,
      rating,
      comment,
    }: {
      bookingId: string;
      rating: number;
      comment: string;
    }) =>
      api.post("/reviews", { bookingId, rating, comment }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã gửi đánh giá");
      setReviewRating(5);
      setReviewComment("");
      qc.invalidateQueries({ queryKey: ["room-detail", id] });
      qc.invalidateQueries({ queryKey: ["can-review", id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (stayDates.checkOut <= stayDates.checkIn) {
      setStayDates((prev) => ({
        ...prev,
        checkOut: addDaysISO(prev.checkIn, 1),
      }));
    }
  }, [stayDates.checkIn, stayDates.checkOut]);

  useEffect(() => {
    const firstRoomId = q.data?.rooms?.[0]?.id;
    if (firstRoomId && !selectedRoomId) {
      setSelectedRoomId(firstRoomId);
    }
  }, [q.data?.rooms, selectedRoomId]);

  if (q.isLoading) return <RoomDetailSkeleton />;
  if (q.error || !q.data)
    return (
      <main className="container-page py-10">
        <EmptyState
          title="Không tìm thấy phòng"
          description={
            q.error ? getApiErrorMessage(q.error) : "Phòng không tồn tại."
          }
        />
      </main>
    );

  const room = q.data;
  const pricePerNight = room.pricingRules[0]?.pricePerNight ?? 0;
  const mainImage =
    room.images[0] ||
    hotelFallbackImage(room.name);
  const address = room.rooms[0]?.branch
    ? `${room.rooms[0].branch.address}, ${room.rooms[0].branch.city}`
    : "Việt Nam";

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép link");
  };

  const toggleSave = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu phòng");
      return;
    }
    if (room.isSaved) unsaveM.mutate();
    else saveM.mutate();
  };

  const goBook = async (roomId?: string) => {
    const targetRoomId = roomId ?? selectedRoomId ?? room.rooms[0]?.id ?? "";
    if (!targetRoomId) {
      toast.error("Chưa có phòng khả dụng để đặt");
      return;
    }
    if (stayDates.checkOut <= stayDates.checkIn) {
      setConflictDialog({
        title: "Khoảng ngày chưa hợp lệ",
        message: "Ngày trả phòng phải sau ngày nhận phòng.",
        selectedFrom: stayDates.checkIn,
        selectedTo: stayDates.checkOut,
        findOtherHref: `/rooms?checkIn=${stayDates.checkIn}&checkOut=${stayDates.checkOut}&guests=${room.maxGuests}`,
      });
      return;
    }
    try {
      const availability = await api
        .get<RangeAvailabilityResponse>("/availability/check", {
          params: {
            roomId: targetRoomId,
            from: stayDates.checkIn,
            to: stayDates.checkOut,
          },
        })
        .then((r) => r.data);

      if (!availability.available) {
        setConflictDialog({
          selectedFrom: stayDates.checkIn,
          selectedTo: stayDates.checkOut,
          conflicts: availability.conflicts,
          findOtherHref: `/rooms?checkIn=${stayDates.checkIn}&checkOut=${stayDates.checkOut}&guests=${room.maxGuests}`,
        });
        return;
      }
    } catch (err) {
      setConflictDialog({
        title: "Không thể kiểm tra lịch phòng",
        message: getApiErrorMessage(err),
        selectedFrom: stayDates.checkIn,
        selectedTo: stayDates.checkOut,
        findOtherHref: `/rooms?checkIn=${stayDates.checkIn}&checkOut=${stayDates.checkOut}&guests=${room.maxGuests}`,
      });
      return;
    }

    const qs = new URLSearchParams({
      roomTypeId: room.id,
      roomId: targetRoomId,
      checkIn: stayDates.checkIn,
      checkOut: stayDates.checkOut,
      guests: String(room.maxGuests),
    });
    router.push(`/booking?${qs.toString()}`);
  };

  const ratingLabel =
    room.avgRating >= 9
      ? "Tuyệt vời"
      : room.avgRating >= 7
        ? "Rất tốt"
        : "Tốt";

  return (
    <main className="customer-page pb-20">
      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </button>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleSave}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-200",
                room.isSaved
                  ? "bg-rose-50 text-rose-500"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              <Heart
                className={cn("h-4 w-4", room.isSaved && "fill-current")}
              />
            </button>
          </div>
        </div>
      </div>

      <section className="container-page mt-5">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:grid-rows-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg shadow-card md:col-span-2 md:row-span-2">
            <img
              src={mainImage}
              alt={room.name}
              className="h-full w-full object-cover"
            />
          </div>
          {room.images.slice(1, 3).map((img, i) => (
            <div
              key={i}
              className="relative hidden aspect-[16/10] overflow-hidden rounded-lg shadow-card md:block"
            >
              <img
                src={img}
                alt={room.name}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink-950">
                  {room.name}
                </h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {address}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-800 ring-1 ring-brand-100">
                  {room.avgRating.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">
                  <p className="font-medium text-slate-700">{ratingLabel}</p>
                  <p>({room.reviewCount} đánh giá)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: room.starRating ?? 3 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-1 text-xs text-slate-400">
                {room.starRating} sao
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ValueChip
                icon={<Users className="h-4 w-4" />}
                label="Sức chứa"
                value={`Tối đa ${room.maxGuests} khách`}
              />
              <ValueChip
                icon={<BedDouble className="h-4 w-4" />}
                label="Giường"
                value={room.bedType}
              />
              <ValueChip
                icon={<Wifi className="h-4 w-4" />}
                label="Tiện nghi"
                value={`${room.amenities?.length ?? 0} tiện nghi`}
              />
            </div>

            <div className="mt-6 border-b border-slate-200">
              <div className="flex gap-6 overflow-x-auto">
                {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors",
                      tab === t
                        ? "border-brand-600 text-brand-700"
                        : "border-transparent text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {tab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <SectionHeading
                      title="Giới thiệu"
                      description={room.description ?? "Không có mô tả."}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tiện nghi
                    </h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Array.isArray(room.amenities) &&
                        room.amenities.map((a) => (
                          <div
                            key={a}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-600" />{" "}
                            {a}
                          </div>
                        ))}
                    </div>
                  </div>

                  {Array.isArray(room.popularFacilities) &&
                    room.popularFacilities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Tiện ích phổ biến
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {room.popularFacilities.map((f) => (
                            <span
                              key={f}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {room.distanceToCenter && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Navigation className="h-4 w-4 text-slate-400" />
                      Cách trung tâm {room.distanceToCenter}
                    </div>
                  )}

                  {Array.isArray(room.nearbyPoints) &&
                    room.nearbyPoints.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Điểm tham quan lân cận
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {room.nearbyPoints.map((p) => (
                            <span
                              key={p}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {tab === "rooms" && (
                <div className="space-y-4">
                  {Array.isArray(room.rooms) &&
                    room.rooms.map((r) => (
                          <Card key={r.id} className="overflow-hidden">
                            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              Phòng {r.roomNumber}
                            </p>
                            <p className="text-sm text-slate-500">
                              Tầng {r.floor} · {r.branch.name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> Tối đa{" "}
                                {room.maxGuests} khách
                              </span>
                              <span className="flex items-center gap-1">
                                <BedDouble className="h-3.5 w-3.5" />{" "}
                                {room.bedType}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-brand-800">
                              {formatCurrency(pricePerNight)}
                            </p>
                            <p className="text-xs text-slate-400">/ đêm</p>
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() => goBook(r.id)}
                            >
                              Chọn
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              {tab === "location" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">{address}</p>
                <div className="aspect-video overflow-hidden rounded-lg border border-slate-200 shadow-card">
                    <iframe
                      title="Bản đồ"
                      className="h-full w-full"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {tab === "policy" && (
                <div className="space-y-6">
                  {room.policies && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Nhận / Trả phòng
                          </p>
                          <p className="text-sm text-slate-600">
                            Nhận phòng từ {room.policies.checkInTime ?? "14:00"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Trả phòng trước{" "}
                            {room.policies.checkOutTime ?? "12:00"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Giấy tờ cần thiết
                          </p>
                          <p className="text-sm text-slate-600">
                            {room.policies.requiredDocuments}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Hướng dẫn nhận phòng
                          </p>
                          <p className="text-sm text-slate-600">
                            {room.policies.generalInstructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {Array.isArray(room.faqs) && room.faqs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Câu hỏi thường gặp
                      </h3>
                      <div className="mt-3 space-y-2">
                        {room.faqs.map((faq, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200"
                          >
                            <button
                              onClick={() =>
                                setExpandedFaq(expandedFaq === idx ? null : idx)
                              }
                              className="flex w-full items-center justify-between p-3 text-left"
                            >
                              <span className="text-sm font-medium text-slate-800">
                                {faq.question}
                              </span>
                              {expandedFaq === idx ? (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                            {expandedFaq === idx && (
                              <p className="px-3 pb-3 text-sm text-slate-600">
                                {faq.answer}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "reviews" && (
                <div className="space-y-6">
                  {user && canReviewQ.data?.canReview && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Viết đánh giá
                      </h3>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setReviewRating(s)}
                            className="p-1"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                s <= reviewRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        rows={3}
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        loading={reviewM.isPending}
                        onClick={() => {
                          const bookingId = canReviewQ.data?.bookingId;
                          if (!bookingId) return;
                          reviewM.mutate({
                            bookingId,
                            rating: reviewRating,
                            comment: reviewComment,
                          });
                        }}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" /> Gửi đánh giá
                      </Button>
                    </div>
                  )}

                  {user && !canReviewQ.data?.canReview && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                      Bạn cần hoàn tất sử dụng phòng mới được đánh giá
                    </div>
                  )}

                  {!user && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                      Vui lòng đăng nhập để đánh giá
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-brand-50 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-brand-700">
                        {room.avgRating.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {room.reviewCount} đánh giá
                      </p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((s) => {
                        const count = room.reviews.filter(
                          (r) => r.rating === s,
                        ).length;
                        const pct =
                          room.reviewCount > 0
                            ? (count / room.reviewCount) * 100
                            : 0;
                        return (
                          <div key={s} className="flex items-center gap-2">
                            <span className="w-3 text-xs text-slate-500">
                              {s}
                            </span>
                            <div className="h-2 flex-1 rounded-full bg-slate-100">
                              <div
                                className="h-2 rounded-full bg-amber-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Array.isArray(room.reviews) &&
                      room.reviews.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                {r.customer?.firstName?.[0] ?? "U"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {r.customer?.firstName} {r.customer?.lastName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {new Date(r.createdAt).toLocaleDateString(
                                    "vi-VN",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                              <Star className="h-3 w-3 fill-current" />{" "}
                              {r.rating}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {r.comment}
                          </p>
                          {r.images && r.images.length > 0 && (
                            <div className="mt-2 flex gap-2 overflow-x-auto">
                              {r.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt=""
                                  className="h-20 w-20 rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-32 space-y-4">
              <Card className="overflow-hidden">
                <div className="bg-ink-950 p-5 text-white">
                  <p className="text-sm text-white/70">Giá mỗi đêm</p>
                  <p className="mt-1 text-3xl font-bold">
                    {formatCurrency(pricePerNight)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/70">
                    Chọn ngày và phòng để kiểm tra lịch trống trước khi gửi yêu
                    cầu đặt chỗ.
                  </p>
                </div>
                <CardContent className="p-5">
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <label className="text-sm font-medium text-slate-700">
                      Ngày nhận phòng
                      <input
                        type="date"
                        value={stayDates.checkIn}
                        min={toISODate(new Date())}
                        onChange={(e) =>
                          setStayDates((prev) => ({
                            ...prev,
                            checkIn: e.target.value,
                          }))
                        }
                        className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Ngày trả phòng
                      <input
                        type="date"
                        value={stayDates.checkOut}
                        min={addDaysISO(stayDates.checkIn, 1)}
                        onChange={(e) =>
                          setStayDates((prev) => ({
                            ...prev,
                            checkOut: e.target.value,
                          }))
                        }
                        className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  {room.rooms.length > 1 && (
                    <label className="mt-3 block text-sm font-medium text-slate-700">
                      Phòng
                      <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                      >
                        {room.rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            Phòng {r.roomNumber} - tầng {r.floor}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="mt-4">
                    <div className="mb-2">
                      <AvailabilityLegend />
                    </div>
                    <AvailabilityCalendar
                      days={availabilityQ.data?.days ?? []}
                      selectedFrom={stayDates.checkIn}
                      selectedTo={stayDates.checkOut}
                      loading={availabilityQ.isLoading}
                    />
                  </div>
                  <Button variant="accent" className="mt-4 w-full" onClick={() => goBook()}>
                    Đặt phòng ngay
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-6 lg:hidden">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Giá mỗi đêm</p>
            <p className="mt-1 text-2xl font-bold text-brand-800">
              {formatCurrency(pricePerNight)}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Ngày nhận phòng
                <input
                  type="date"
                  value={stayDates.checkIn}
                  min={toISODate(new Date())}
                  onChange={(e) =>
                    setStayDates((prev) => ({
                      ...prev,
                      checkIn: e.target.value,
                    }))
                  }
                  className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Ngày trả phòng
                <input
                  type="date"
                  value={stayDates.checkOut}
                  min={addDaysISO(stayDates.checkIn, 1)}
                  onChange={(e) =>
                    setStayDates((prev) => ({
                      ...prev,
                      checkOut: e.target.value,
                    }))
                  }
                  className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
                />
              </label>
            </div>
            {room.rooms.length > 1 && (
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Phòng
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {room.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.roomNumber} - tầng {r.floor}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="mt-4">
              <AvailabilityCalendar
                days={availabilityQ.data?.days ?? []}
                selectedFrom={stayDates.checkIn}
                selectedTo={stayDates.checkOut}
                loading={availabilityQ.isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {Array.isArray(room.similarRooms) && room.similarRooms.length > 0 && (
        <section className="container-page mt-12">
          <h2 className="text-xl font-bold text-slate-900">Phòng tương tự</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {room.similarRooms.map((sr) => (
              <div
                key={sr.id}
                onClick={() => router.push(`/rooms/${sr.id}`)}
                className="cursor-pointer overflow-hidden rounded-lg bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={
                      sr.images?.[0] ||
                    hotelFallbackImage(sr.name)
                    }
                    alt={sr.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{sr.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {sr.branch?.city ?? "Việt Nam"}
                  </p>
                  <p className="mt-2 text-lg font-bold text-brand-800">
                    {formatCurrency(sr.pricePerNight)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white p-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Giá mỗi đêm</p>
            <p className="text-xl font-bold text-brand-800">
              {formatCurrency(pricePerNight)}
            </p>
          </div>
          <Button variant="accent" onClick={() => goBook()}>
            Đặt phòng ngay
          </Button>
        </div>
      </div>

      {showBackTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 lg:bottom-6"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <BookingConflictDialog
        open={Boolean(conflictDialog)}
        data={conflictDialog}
        onClose={() => setConflictDialog(null)}
        onChooseDates={() => setConflictDialog(null)}
        onFindOther={() => {
          if (conflictDialog?.findOtherHref) {
            router.push(conflictDialog.findOtherHref);
          }
        }}
      />
    </main>
  );
}

function RoomDetailSkeleton() {
  return (
    <main className="container-page py-8">
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </main>
  );
}

function ValueChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold text-ink-950">
        {value}
      </p>
    </div>
  );
}

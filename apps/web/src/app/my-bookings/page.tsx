"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  XCircle,
  BedDouble,
  Tag,
  Clock,
  CreditCard,
  Banknote,
  AlertCircle,
  Star,
  MessageSquare,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import {
  BookingStatusBadge,
  bookingStatusAction,
  bookingStatusLabel,
} from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SectionHeading, hotelFallbackImage } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  diffNights,
} from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

const STATUSES:
  | { value: ""; label: string }[]
  | { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "PENDING_HOST_APPROVAL", label: "Chờ duyệt yêu cầu" },
  { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "CHECKED_IN", label: "Đang lưu trú" },
  { value: "CHECKED_OUT", label: "Đã hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "REJECTED", label: "Bị từ chối" },
];

export default function MyBookingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [status, setStatus] = useState<string>("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const qc = useQueryClient();

  useEffect(() => {
    if (hydrated && !user) router.replace("/login?next=/my-bookings");
  }, [hydrated, user, router]);

  const q = useQuery({
    queryKey: ["my-bookings", status],
    enabled: Boolean(user),
    queryFn: () =>
      api
        .get("/bookings/my", {
          params: { page: 1, limit: 20, ...(status ? { status } : {}) },
        })
        .then((r) => r.data),
  });

  const cancelM = useMutation({
    mutationFn: (id: string) =>
      api.post(`/bookings/${id}/cancel`, {}).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã hủy đơn thành công");
      setCancelTarget(null);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e) => toast.error("Hủy đơn thất bại", getApiErrorMessage(e)),
  });

  const payNowM = useMutation({
    mutationFn: ({
      bookingId,
      couponCode,
    }: {
      bookingId: string;
      couponCode?: string;
    }) =>
      api
        .post("/payments/initiate", {
          bookingId,
          method: "VNPAY",
          couponCode,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (data.gatewayUrl) window.location.href = data.gatewayUrl;
      else {
        toast.success("Thanh toán thành công");
        qc.invalidateQueries({ queryKey: ["my-bookings"] });
      }
    },
    onError: (e) =>
      toast.error("Không thể mở thanh toán", getApiErrorMessage(e)),
  });

  const payLaterM = useMutation({
    mutationFn: ({
      bookingId,
      couponCode,
    }: {
      bookingId: string;
      couponCode?: string;
    }) =>
      api
        .post("/payments/initiate", {
          bookingId,
          method: "CASH",
          couponCode,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã chọn thanh toán tại quầy");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e) => toast.error("Không thể chọn thanh toán tại quầy", getApiErrorMessage(e)),
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
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e) => toast.error("Gửi đánh giá thất bại", getApiErrorMessage(e)),
  });

  const [activeTab, setActiveTab] = useState<"bookings" | "wishlist">(
    "bookings",
  );
  const items: Booking[] = q.data?.data ?? [];

  const wishlistQ = useQuery({
    queryKey: ["wishlist"],
    enabled: activeTab === "wishlist" && Boolean(user),
    queryFn: () => api.get("/wishlist").then((r) => r.data),
  });

  return (
    <main className="customer-page">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-8">
          <SectionHeading
            kicker="My stays"
            title="Phòng đã đặt"
            description="Theo dõi yêu cầu đặt chỗ, thời hạn duyệt, thời hạn thanh toán và các hành động tiếp theo trong một nơi."
          />
        </div>
      </section>

      <div className="container-page py-8">
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "bookings"
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Phòng đã đặt
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "wishlist"
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Phòng đã lưu
          </button>
        </div>
      </div>

      {activeTab === "bookings" && (
        <div className="mt-6 space-y-4">
          <div className="toolbar-panel w-full sm:w-80">
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          {q.isLoading && <ListSkeleton />}
          {q.error && (
            <EmptyState
              icon={<AlertCircle className="h-5 w-5" />}
              title="Không tải được dữ liệu"
              description={getApiErrorMessage(q.error)}
            />
          )}
          {q.data && items.length === 0 && (
            <EmptyState
              icon={<BedDouble className="h-5 w-5" />}
              title="Bạn chưa có đơn đặt phòng nào"
              description="Khám phá các phòng khách sạn của chúng tôi và đặt ngay."
              action={
                <Button onClick={() => router.push("/rooms")}>Tìm phòng</Button>
              }
            />
          )}
          {items.map((b) => (
            <BookingItem
              key={b.id}
              booking={b}
              onCancel={() => setCancelTarget(b)}
              onPay={(couponCode) =>
                payNowM.mutate({ bookingId: b.id, couponCode })
              }
              onPayLater={(couponCode) =>
                payLaterM.mutate({ bookingId: b.id, couponCode })
              }
              paying={payNowM.isPending}
              payingLater={payLaterM.isPending}
              onReview={() => setReviewTarget(b)}
            />
          ))}
        </div>
      )}

      {activeTab === "wishlist" && (
        <div className="mt-6 space-y-4">
          {wishlistQ.isLoading && <ListSkeleton />}
          {wishlistQ.error && (
            <EmptyState
              icon={<AlertCircle className="h-5 w-5" />}
              title="Không tải được dữ liệu"
              description={getApiErrorMessage(wishlistQ.error)}
            />
          )}
          {wishlistQ.data && (wishlistQ.data as any[]).length === 0 && (
            <EmptyState
              icon={<BedDouble className="h-5 w-5" />}
              title="Bạn chưa lưu phòng nào"
              description="Khám phá các phòng khách sạn và lưu lại để xem sau."
              action={
                <Button onClick={() => router.push("/rooms")}>Tìm phòng</Button>
              }
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(wishlistQ.data as any[])?.map((w: any) => (
              <div
                key={w.id}
                onClick={() => router.push(`/rooms/${w.roomTypeId}`)}
                className="cursor-pointer overflow-hidden rounded-lg bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={
                      w.roomType.images?.[0] ||
                      hotelFallbackImage(w.roomType.name)
                    }
                    alt={w.roomType.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <Link
                    href={`/rooms/${w.roomTypeId}`}
                    className="font-semibold text-slate-900 hover:text-brand-600 hover:underline"
                  >
                    {w.roomType.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {w.roomType.branch?.city ?? "Việt Nam"}
                  </p>
                  <p className="mt-2 text-lg font-bold text-brand-700">
                    {formatCurrency(w.roomType.pricePerNight ?? 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Xác nhận hủy đơn"
        description={`Bạn có chắc muốn hủy đơn ${cancelTarget?.bookingCode}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>
              Quay lại
            </Button>
            <Button
              variant="danger"
              loading={cancelM.isPending}
              onClick={() => cancelTarget && cancelM.mutate(cancelTarget.id)}
            >
              Hủy đơn
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Hành động này không thể hoàn tác. Phòng sẽ được giải phóng cho khách
          khác đặt.
        </p>
      </Modal>

      <Modal
        open={!!reviewTarget}
        onClose={() => {
          setReviewTarget(null);
          setReviewRating(5);
          setReviewComment("");
        }}
        title="Đánh giá phòng"
        description={`${reviewTarget?.room?.roomType?.name ?? ""} · #${reviewTarget?.room?.roomNumber ?? ""}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setReviewTarget(null);
                setReviewRating(5);
                setReviewComment("");
              }}
            >
              Hủy
            </Button>
            <Button
              loading={reviewM.isPending}
              onClick={() =>
                reviewTarget &&
                reviewM.mutate({
                  bookingId: reviewTarget.id,
                  rating: reviewRating,
                  comment: reviewComment,
                })
              }
            >
              Gửi đánh giá
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Xếp hạng</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      s <= reviewRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Nhận xét</p>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              rows={4}
            />
          </div>
        </div>
      </Modal>
      </div>
    </main>
  );
}

function BookingItem({
  booking,
  onCancel,
  onPay,
  onPayLater,
  paying,
  payingLater,
  onReview,
}: {
  booking: Booking;
  onCancel: () => void;
  onPay: (couponCode?: string) => void;
  onPayLater: (couponCode?: string) => void;
  paying: boolean;
  payingLater: boolean;
  onReview: () => void;
}) {
  const router = useRouter();
  const nights = diffNights(booking.checkIn, booking.checkOut);
  const canCancel: BookingStatus[] = [
    "PENDING_HOST_APPROVAL",
    "PENDING_PAYMENT",
    "CONFIRMED",
  ];
  const canPayNow =
    booking.status === "PENDING_PAYMENT" ||
    (booking.status === "PAYING" && booking.payment?.method === "VNPAY");
  const canPayLater = booking.status === "PENDING_PAYMENT";
  const canReview = booking.status === "CHECKED_OUT" && !booking.review;
  const [couponCode, setCouponCode] = useState("");

  const fallbackImg = hotelFallbackImage(booking.room?.roomType?.name ?? "");
  const roomImg = booking.room?.roomType?.images?.[0] ?? fallbackImg;

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift"
      onClick={() => router.push(`/my-bookings/${booking.id}`)}
    >
      <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <img
            src={roomImg}
            alt={booking.room?.roomType?.name ?? "Phòng"}
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="line-clamp-2 font-semibold text-ink-950">
                {booking.room?.roomType?.name ?? "Phòng"} · #
                {booking.room?.roomNumber}
              </p>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              <Tag className="mr-1 inline h-3 w-3" />
              {booking.bookingCode}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formatDate(booking.checkIn)}{" "}
                {booking.checkInTime ? `(${booking.checkInTime})` : ""} →{" "}
                {formatDate(booking.checkOut)}{" "}
                {booking.checkOutTime ? `(${booking.checkOutTime})` : ""} (
                {nights} đêm)
              </span>
              {booking.status === "PENDING_HOST_APPROVAL" &&
                booking.approvalDeadline && (
                  <span className="inline-flex items-center gap-1.5 text-violet-700">
                    <Clock className="h-4 w-4" /> Hạn duyệt:{" "}
                    {formatDateTime(booking.approvalDeadline)}
                  </span>
                )}
              {booking.status === "PENDING_PAYMENT" &&
                booking.paymentDeadline && (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <Clock className="h-4 w-4" /> Hạn thanh toán:{" "}
                  {formatDateTime(booking.paymentDeadline)}
                </span>
              )}
            </div>
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 ring-1 ring-slate-200">
              <span className="font-semibold">
                {bookingStatusLabel(booking.status)}:
              </span>{" "}
              {bookingStatusAction(booking.status)}
            </p>
            {booking.specialRequests && (
              <p className="mt-1 text-xs text-slate-500">
                Yêu cầu: {booking.specialRequests}
              </p>
            )}
            {booking.rejectedReason && (
              <p className="mt-1 text-xs text-rose-600">
                Lý do từ chối: {booking.rejectedReason}
              </p>
            )}
            {booking.status === "CONFIRMED" && booking.payment?.status !== "COMPLETED" && (
              <p className="mt-1 text-xs text-amber-700">
                Thanh toán tại quầy: lễ tân sẽ thu tiền trước khi check-in. Nếu quá giờ nhận phòng 2 tiếng mà chưa check-in, đơn có thể bị hủy.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <p className="text-xl font-bold text-brand-800">
            {formatCurrency(booking.totalAmount)}
          </p>
          {booking.payment && (
            <p className="text-xs text-slate-500">
              Thanh toán: {formatCurrency(booking.payment.amount)} (
              {booking.payment.method})
            </p>
          )}
          <div
            className="flex w-full flex-col items-stretch gap-2 sm:w-auto lg:items-end"
            onClick={(e) => e.stopPropagation()}
          >
            {(canPayNow || canPayLater) && (
              <div className="flex flex-col items-end gap-2">
                {booking.status === "PENDING_PAYMENT" && (
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Mã giảm giá"
                    className="h-8 w-36 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-brand-500"
                  />
                )}
                {canPayNow && (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => onPay(couponCode.trim() || undefined)}
                    loading={paying}
                  >
                    <CreditCard className="h-4 w-4" /> {booking.status === "PAYING" ? "Thanh toán lại" : "Thanh toán"}
                  </Button>
                )}
                {canPayLater && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPayLater(couponCode.trim() || undefined)}
                    loading={payingLater}
                  >
                    <Banknote className="h-4 w-4" /> Thanh toán tại quầy
                  </Button>
                )}
              </div>
            )}
            {canCancel.includes(booking.status) && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                <XCircle className="h-4 w-4" /> Hủy
              </Button>
            )}
            {canReview && (
              <Button size="sm" variant="outline" onClick={onReview}>
                <Star className="h-4 w-4" /> Đánh giá
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </>
  );
}

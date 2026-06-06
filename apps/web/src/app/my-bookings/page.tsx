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
  AlertCircle,
  Receipt,
  Upload,
  Star,
  MessageSquare,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { BookingStatusBadge, bookingStatusLabel } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
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
  { value: "PENDING_APPROVAL", label: "Chờ duyệt biên lai" },
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

  const payM = useMutation({
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
    },
    onError: (e) =>
      toast.error("Không thể mở thanh toán", getApiErrorMessage(e)),
  });

  const uploadM = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      api
        .post(`/bookings/${id}/upload-receipt`, { receiptImageUrl: url })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã upload biên lai");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (e) => toast.error("Upload thất bại", getApiErrorMessage(e)),
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
    <main className="container-page py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phòng đã đặt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem và quản lý các đơn đặt phòng và phòng đã lưu
          </p>
        </div>
      </div>

      <div className="mt-6 border-b border-slate-200">
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
          <div className="w-full sm:w-60">
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
                payM.mutate({ bookingId: b.id, couponCode })
              }
              paying={payM.isPending}
              onUpload={(id, url) => uploadM.mutate({ id, url })}
              uploading={uploadM.isPending}
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
                className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={
                      w.roomType.images?.[0] ||
                      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
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
    </main>
  );
}

function BookingItem({
  booking,
  onCancel,
  onPay,
  paying,
  onUpload,
  uploading,
  onReview,
}: {
  booking: Booking;
  onCancel: () => void;
  onPay: (couponCode?: string) => void;
  paying: boolean;
  onUpload: (id: string, url: string) => void;
  uploading: boolean;
  onReview: () => void;
}) {
  const router = useRouter();
  const nights = diffNights(booking.checkIn, booking.checkOut);
  const canCancel: BookingStatus[] = [
    "PENDING_HOST_APPROVAL",
    "PENDING_PAYMENT",
    "CONFIRMED",
  ];
  const canPay: BookingStatus[] = ["PENDING_PAYMENT"];
  const canUpload: BookingStatus[] = ["PENDING_PAYMENT"];
  const canReview = booking.status === "CHECKED_OUT" && !booking.review;
  const [receiptUrl, setReceiptUrl] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const fallbackImg =
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80";
  const roomImg = booking.room?.roomType?.images?.[0] ?? fallbackImg;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => router.push(`/my-bookings/${booking.id}`)}
    >
      <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between py-5">
        <div className="flex flex-1 items-start gap-4">
          <img
            src={roomImg}
            alt={booking.room?.roomType?.name ?? "Phòng"}
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">
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
            {canUpload.includes(booking.status) && !showUpload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUpload(true);
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <Receipt className="h-3.5 w-3.5" /> Upload biên lai chuyển khoản
              </button>
            )}
            {showUpload && (
              <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Dán link ảnh biên lai"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-brand-500"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!receiptUrl.trim()) return;
                    onUpload(booking.id, receiptUrl.trim());
                    setShowUpload(false);
                    setReceiptUrl("");
                  }}
                  loading={uploading}
                >
                  <Upload className="h-3.5 w-3.5" /> Gửi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowUpload(false)}
                >
                  Hủy
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="text-xl font-bold text-brand-700">
            {formatCurrency(booking.totalAmount)}
          </p>
          {booking.payment && (
            <p className="text-xs text-slate-500">
              Đã thanh toán: {formatCurrency(booking.payment.amount)} (
              {booking.payment.paymentType})
            </p>
          )}
          <div
            className="flex flex-col items-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {canPay.includes(booking.status) && (
              <div className="flex flex-col items-end gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Mã giảm giá"
                  className="h-8 w-36 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-brand-500"
                />
                <Button
                  size="sm"
                  onClick={() => onPay(couponCode.trim() || undefined)}
                  loading={paying}
                >
                  <CreditCard className="h-4 w-4" /> Thanh toán
                </Button>
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

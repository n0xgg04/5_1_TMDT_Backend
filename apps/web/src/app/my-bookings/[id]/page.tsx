"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  Tag,
  MapPin,
  BedDouble,
  CreditCard,
  XCircle,
  Star,
  Receipt,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate, diffNights } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["booking", id],
    enabled: !!id,
    queryFn: () => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  });

  const cancelM = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã hủy đơn");
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const payM = useMutation({
    mutationFn: () =>
      api.post(`/payments/initiate`, { bookingId: id }).then((r) => r.data),
    onSuccess: (data) => {
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (q.isLoading) return <DetailSkeleton />;
  if (q.error || !q.data)
    return (
      <main className="container-page py-10">
        <EmptyState
          title="Không tìm thấy đơn"
          description={
            q.error ? getApiErrorMessage(q.error) : "Đơn không tồn tại."
          }
        />
      </main>
    );

  const b = q.data;
  const nights = diffNights(b.checkIn, b.checkOut);
  const canCancel: BookingStatus[] = [
    "PENDING_PAYMENT",
    "PENDING_APPROVAL",
    "CONFIRMED",
  ];
  const canPay = b.status === "PENDING_PAYMENT";
  const canReview = b.status === "CHECKED_OUT" && !b.review;
  const fallbackImg =
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80";
  const roomImg = b.room?.roomType?.images?.[0] ?? fallbackImg;

  return (
    <main className="container-page py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
            <img
              src={roomImg}
              alt={b.room?.roomType?.name ?? "Phòng"}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {b.room?.roomType?.name ?? "Phòng"} · #{b.room?.roomNumber}
              </h1>
              <BookingStatusBadge status={b.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Tag className="mr-1 inline h-3.5 w-3.5" />
              {b.bookingCode}
            </p>
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Thông tin lưu trú
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Nhận phòng"
                  value={`${formatDate(b.checkIn)} ${b.checkInTime ? `(${b.checkInTime})` : ""}`}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Trả phòng"
                  value={`${formatDate(b.checkOut)} ${b.checkOutTime ? `(${b.checkOutTime})` : ""}`}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Số đêm"
                  value={`${nights} đêm`}
                />
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Khách"
                  value={`${b.adults ?? 1} ngườ i lớn${b.children ? `, ${b.children} trẻ em` : ""}`}
                />
                <InfoRow
                  icon={<BedDouble className="h-4 w-4" />}
                  label="Loại giường"
                  value={b.room?.roomType?.bedType ?? "-"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Chi nhánh"
                  value={b.room?.branch?.name ?? "-"}
                />
              </div>
              {b.specialRequests && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-medium">Yêu cầu đặc biệt:</span>{" "}
                  {b.specialRequests}
                </div>
              )}
              {b.rejectedReason && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  <span className="font-medium">Lý do từ chối:</span>{" "}
                  {b.rejectedReason}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Chi tiết giá</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tổng tiền</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </div>
                {b.payment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Đã thanh toán</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(b.payment.amount)} (
                      {b.payment.paymentType})
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">
                    Trạng thái
                  </span>
                  <BookingStatusBadge status={b.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {canPay && (
                  <Button
                    className="w-full"
                    onClick={() => payM.mutate()}
                    loading={payM.isPending}
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Thanh toán ngay
                  </Button>
                )}
                {canCancel.includes(b.status) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => cancelM.mutate()}
                    loading={cancelM.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Hủy đơn
                  </Button>
                )}
                {canReview && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/my-bookings/${id}/review`)}
                  >
                    <Star className="mr-2 h-4 w-4" /> Viết đánh giá
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="container-page py-8">
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Star } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import type { Booking } from "@/lib/types";

export default function BookingReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const bookingQ = useQuery({
    queryKey: ["booking", id],
    enabled: !!id,
    queryFn: () => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  });

  const reviewM = useMutation({
    mutationFn: () =>
      api.post("/reviews", { bookingId: id, rating, comment }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã gửi đánh giá");
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      router.push(`/my-bookings/${id}`);
    },
    onError: (e) => toast.error("Gửi đánh giá thất bại", getApiErrorMessage(e)),
  });

  if (bookingQ.isLoading) {
    return (
      <main className="container-page py-8">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (bookingQ.error || !bookingQ.data) {
    return (
      <main className="container-page py-10">
        <EmptyState
          title="Không tìm thấy đơn"
          description={
            bookingQ.error
              ? getApiErrorMessage(bookingQ.error)
              : "Đơn không tồn tại."
          }
        />
      </main>
    );
  }

  const booking = bookingQ.data;
  const canReview = booking.status === "CHECKED_OUT" && !booking.review;

  return (
    <main className="customer-page">
      <div className="container-page py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </button>

        <Card>
          <CardContent className="space-y-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-ink-950">Đánh giá dịch vụ</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {booking.room?.roomType?.name ?? "Phòng"} · #{booking.room?.roomNumber ?? "-"}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {!canReview ? (
              <EmptyState
                title="Chưa thể đánh giá đơn này"
                description={
                  booking.review
                    ? "Đơn này đã được đánh giá trước đó."
                    : "Bạn chỉ có thể đánh giá sau khi đã check-out."
                }
                action={
                  <Button onClick={() => router.push(`/my-bookings/${id}`)}>
                    Quay về chi tiết đơn
                  </Button>
                }
              />
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Xếp hạng</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="p-1"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            value <= rating
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
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    rows={5}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => router.push(`/my-bookings/${id}`)}>
                    Hủy
                  </Button>
                  <Button onClick={() => reviewM.mutate()} loading={reviewM.isPending}>
                    Gửi đánh giá
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

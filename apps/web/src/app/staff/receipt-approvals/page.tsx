"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CreditCard, Receipt, ShieldAlert, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/ui/badge";
import { OperationHeader } from "@/components/hotel/commercial";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

type BookingListResponse = {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
};

type ManualAction = {
  bookingId: string;
  method: "CASH" | "BANK_TRANSFER";
  modeLabel: string;
  title: string;
  description: string;
};

export default function StaffReceiptApprovalsPage() {
  const qc = useQueryClient();
  const [pendingAction, setPendingAction] = useState<ManualAction | null>(null);
  const pendingPaymentQ = useQuery({
    queryKey: ["staff-payment-pending"],
    queryFn: () =>
      api
        .get<BookingListResponse>("/bookings", {
          params: { status: "PENDING_PAYMENT", limit: 20 },
        })
        .then((r) => r.data),
  });

  const payingQ = useQuery({
    queryKey: ["staff-payment-processing"],
    queryFn: () =>
      api
        .get<BookingListResponse>("/bookings", {
          params: { status: "PAYING", limit: 20 },
        })
        .then((r) => r.data),
  });

  const pendingPayment = pendingPaymentQ.data?.data ?? [];
  const paying = payingQ.data?.data ?? [];
  const loading = pendingPaymentQ.isLoading || payingQ.isLoading;

  const confirmManualM = useMutation({
    mutationFn: ({ bookingId, method }: { bookingId: string; method: "CASH" | "BANK_TRANSFER" }) =>
      api.post(`/payments/booking/${bookingId}/manual-confirm`, { method }),
    onSuccess: () => {
      toast.success("Đã xác nhận thanh toán thủ công");
      qc.invalidateQueries({ queryKey: ["staff-payment-pending"] });
      qc.invalidateQueries({ queryKey: ["staff-payment-processing"] });
    },
    onError: (e) => toast.error("Xác nhận thanh toán thất bại", getApiErrorMessage(e)),
  });

  return (
    <div>
      <OperationHeader
        kicker="Payment flow"
        title="Theo dõi thanh toán"
        description="Hệ thống hiện không có bước duyệt biên lai. Staff chỉ cần theo dõi booking đang chờ khách thanh toán hoặc đang ở luồng thanh toán online."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-amber-500" />
              Booking chờ thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Đây là các booking đã được duyệt nhưng khách chưa hoàn tất thanh toán.
              Staff không cần duyệt biên lai tại đây.
            </p>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : pendingPayment.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Không có booking nào đang chờ thanh toán.
              </div>
            ) : (
              pendingPayment.map((booking) => (
                <PaymentBookingCard
                  key={booking.id}
                  booking={booking}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPendingAction({
                          bookingId: booking.id,
                          method: "CASH",
                          modeLabel: "Thanh toán tại quầy",
                          title: "Xác nhận đã thu tiền tại quầy",
                          description:
                            "Hành động này sẽ đánh dấu booking là đã thanh toán thủ công. Lễ tân chỉ nên xác nhận sau khi đã nhận đủ tiền mặt từ khách.",
                        })
                      }
                    >
                      <Wallet className="h-4 w-4" /> Xác nhận thu tiền tại quầy
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-sky-500" />
              Booking đang thanh toán online
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Booking ở trạng thái này đang chờ callback thanh toán hoặc khách đang
              tiếp tục thanh toán trên cổng online.
            </p>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : paying.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Không có booking nào đang ở luồng thanh toán online.
              </div>
            ) : (
              paying.map((booking) => (
                <PaymentBookingCard
                  key={booking.id}
                  booking={booking}
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPendingAction({
                          bookingId: booking.id,
                          method:
                            booking.payment?.method === "BANK_TRANSFER"
                              ? "BANK_TRANSFER"
                              : "CASH",
                          modeLabel:
                            booking.payment?.method === "BANK_TRANSFER"
                              ? "Chuyển khoản xử lý thủ công"
                              : "Thanh toán thủ công tại quầy",
                          title: "Xác nhận xử lý thanh toán thủ công",
                          description:
                            "Dùng khi khách gặp sự cố với cổng thanh toán online hoặc đã thanh toán trực tiếp tại quầy. Hãy chắc chắn staff đã xác minh tiền đã được nhận.",
                        })
                      }
                    >
                      <Receipt className="h-4 w-4" /> Xác nhận xử lý thủ công
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-brand-600" />
            Hướng dẫn vận hành cho staff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>1. Staff duyệt yêu cầu đặt chỗ ở mục `Duyệt yêu cầu`.</p>
          <p>2. Sau khi được duyệt, khách tự thanh toán trên website hoặc cổng thanh toán.</p>
          <p>3. Khi thanh toán thành công, booking sẽ tự chuyển sang `CONFIRMED`.</p>
          <p>4. Lễ tân thực hiện nhận/trả phòng ở mục `Check-in / out`.</p>
          <div className="pt-2">
            <Button variant="outline" onClick={() => (window.location.href = "/staff/check-in")}>
              Mở khu vực Check-in / out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.title}
        description={pendingAction?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingAction(null)}>
              Hủy
            </Button>
            <Button
              variant="accent"
              loading={confirmManualM.isPending}
              onClick={() => {
                if (!pendingAction) return;
                confirmManualM.mutate(
                  {
                    bookingId: pendingAction.bookingId,
                    method: pendingAction.method,
                  },
                  {
                    onSuccess: () => setPendingAction(null),
                  },
                );
              }}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4" />
            <p>
              Đây là thao tác nhạy cảm vì sẽ ghi nhận thanh toán thành công cho booking.
              Chỉ xác nhận khi staff đã kiểm tra và nhận tiền thực tế.
            </p>
          </div>
          {pendingAction && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p>
                <span className="font-medium">Phương thức xử lý:</span> {pendingAction.modeLabel}
              </p>
              <p className="mt-1 text-slate-600">
                Booking ID: <span className="font-mono">{pendingAction.bookingId}</span>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function PaymentBookingCard({
  booking,
  action,
}: {
  booking: Booking;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">#{booking.bookingCode}</p>
          <p className="mt-1 text-sm text-slate-600">
            {(booking.customer?.firstName ?? "").trim()} {(booking.customer?.lastName ?? "").trim()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          {booking.payment?.method === "CASH" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              <Banknote className="h-3.5 w-3.5" /> Thanh toán tại quầy
            </span>
          ) : booking.payment?.method === "BANK_TRANSFER" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
              <Receipt className="h-3.5 w-3.5" /> Chuyển khoản
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800">
              <CreditCard className="h-3.5 w-3.5" /> Thanh toán online
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Phòng</p>
          <p className="font-medium text-slate-800">
            #{booking.room?.roomNumber ?? ""} - {booking.room?.roomType?.name ?? "Phòng"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tổng tiền</p>
          <p className="font-medium text-slate-800">{formatCurrency(booking.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p className="font-medium text-slate-800">{booking.customer?.email ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Hạn thanh toán</p>
          <p className="font-medium text-slate-800">
            {booking.paymentDeadline ? formatDateTime(booking.paymentDeadline) : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Phương thức thanh toán</p>
          <p className="font-medium text-slate-800">{labelPaymentMethod(booking)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Trạng thái payment</p>
          <p className="font-medium text-slate-800">{booking.payment?.status ?? "Chưa tạo payment"}</p>
        </div>
      </div>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function labelPaymentMethod(booking: Booking) {
  switch (booking.payment?.method) {
    case "CASH":
      return "Thanh toán tại quầy";
    case "BANK_TRANSFER":
      return "Chuyển khoản";
    case "VNPAY":
      return "VNPay";
    case "VISA":
      return "VISA/Stripe";
    default:
      return booking.payment?.method ?? "Chưa xác định";
  }
}

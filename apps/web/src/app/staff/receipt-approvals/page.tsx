"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  Receipt,
  ShieldAlert,
  Wallet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  const [showOnlineIssues, setShowOnlineIssues] = useState(false);

  const pendingPaymentQ = useQuery({
    queryKey: ["staff-payment-pending"],
    queryFn: () =>
      api
        .get<BookingListResponse>("/bookings", {
          params: { status: "PENDING_PAYMENT", limit: 30 },
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

  const confirmedQ = useQuery({
    queryKey: ["staff-confirmed-unpaid"],
    queryFn: () =>
      api
        .get<BookingListResponse>("/bookings", {
          params: { status: "CONFIRMED", limit: 20 },
        })
        .then((r) => r.data),
  });

  const allPending = pendingPaymentQ.data?.data ?? [];
  const paying = payingQ.data?.data ?? [];
  const confirmed = confirmedQ.data?.data ?? [];

  const cashAtDesk = allPending.filter(
    (b) => b.payment?.method === "CASH",
  );
  const waitingOnline = allPending.filter(
    (b) => b.payment?.method !== "CASH",
  );
  const confirmedUnpaidCash = confirmed.filter(
    (b) => b.payment?.status !== "COMPLETED",
  );

  const loading =
    pendingPaymentQ.isLoading || payingQ.isLoading || confirmedQ.isLoading;

  const confirmManualM = useMutation({
    mutationFn: ({
      bookingId,
      method,
    }: {
      bookingId: string;
      method: "CASH" | "BANK_TRANSFER";
    }) =>
      api.post(`/payments/booking/${bookingId}/manual-confirm`, { method }),
    onSuccess: () => {
      toast.success("Đã xác nhận thanh toán thủ công");
      qc.invalidateQueries({ queryKey: ["staff-payment-pending"] });
      qc.invalidateQueries({ queryKey: ["staff-payment-processing"] });
      qc.invalidateQueries({ queryKey: ["staff-confirmed-unpaid"] });
    },
    onError: (e) =>
      toast.error("Xác nhận thanh toán thất bại", getApiErrorMessage(e)),
  });

  return (
    <div>
      <OperationHeader
        kicker="Payment desk"
        title="Theo dõi thanh toán"
        description="Quản lý thu tiền mặt tại quầy và theo dõi các giao dịch online. Thao tác xác nhận thủ công chỉ dành cho trường hợp ngoại lệ."
      />

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Section 1: Cash at counter – the common daily operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-emerald-600" />
              Thanh toán tiền mặt tại quầy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Booking đã chọn thanh toán tại quầy hoặc đã xác nhận giữ chỗ nhưng chưa thu tiền. Đây là thao tác lễ tân làm hàng ngày.
            </p>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : cashAtDesk.length === 0 &&
              confirmedUnpaidCash.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Không có booking nào cần thu tiền mặt tại quầy.
              </div>
            ) : (
              <>
                {/* Pending payment cash bookings */}
                {cashAtDesk.map((booking) => (
                  <PaymentBookingCard
                    key={booking.id}
                    booking={booking}
                    action={
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() =>
                          setPendingAction({
                            bookingId: booking.id,
                            method: "CASH",
                            modeLabel: "Xác nhận đã thu đủ tiền mặt",
                            title: "Xác nhận thu tiền mặt",
                            description:
                              "Hành động này sẽ ghi nhận thanh toán thành công. Chỉ xác nhận khi lễ tân đã nhận đủ tiền mặt từ khách.",
                          })
                        }
                      >
                        <Wallet className="h-4 w-4" /> Thu tiền mặt
                      </Button>
                    }
                  />
                ))}
                {/* Confirmed but unpaid cash bookings */}
                {confirmedUnpaidCash.map((booking) => (
                  <PaymentBookingCard
                    key={booking.id}
                    booking={booking}
                    highlight="amber"
                    extra={
                      <p className="mt-2 text-xs text-amber-700">
                        Booking đã xác nhận nhưng chưa thu tiền. Lễ tân cần thu trước khi check-in.
                      </p>
                    }
                    action={
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() =>
                          setPendingAction({
                            bookingId: booking.id,
                            method: "CASH",
                            modeLabel: "Xác nhận đã thu đủ tiền mặt (booking đã confirm)",
                            title: "Xác nhận thu tiền mặt",
                            description:
                              "Hành động này sẽ ghi nhận thanh toán thành công. Chỉ xác nhận khi lễ tân đã nhận đủ tiền mặt từ khách.",
                          })
                        }
                      >
                        <Wallet className="h-4 w-4" /> Thu tiền mặt
                      </Button>
                    }
                  />
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Online payments waiting for customer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-sky-600" />
              Chờ khách thanh toán online
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Booking đã được duyệt và đang chờ khách tự thanh toán qua cổng online. Các booking này sẽ tự động chuyển sang xác nhận khi khách thanh toán thành công.
            </p>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : waitingOnline.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Không có booking nào đang chờ khách thanh toán online.
              </div>
            ) : (
              waitingOnline.map((booking) => (
                <PaymentBookingCard
                  key={booking.id}
                  booking={booking}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Online payment issues – rare, collapsed by default */}
      <Card className="mt-5">
        <button
          onClick={() => setShowOnlineIssues((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <span className="text-base font-semibold text-slate-900">
              Xử lý sự cố thanh toán online
            </span>
            {paying.length > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                {paying.length}
              </span>
            )}
            <span className="text-xs text-rose-600 font-medium">· Ít dùng – chỉ khi lỗi cổng thanh toán</span>
          </div>
          {showOnlineIssues ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>
        {showOnlineIssues && (
          <CardContent className="space-y-4 border-t border-slate-100 pt-4">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>Cảnh báo:</strong> Chỉ dùng khi khách đã thanh toán nhưng hệ thống không ghi nhận (lỗi callback), hoặc khách gặp sự cố không thể hoàn tất giao dịch online. Việc xác nhận thủ công ở đây cần kiểm tra kỹ sao kê ngân hàng.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : paying.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Không có booking nào đang gặp sự cố thanh toán online.
              </div>
            ) : (
              paying.map((booking) => (
                <PaymentBookingCard
                  key={booking.id}
                  booking={booking}
                  highlight="rose"
                  extra={
                    <p className="mt-2 text-xs text-rose-700">
                      Booking đang trong trạng thái chờ xử lý giao dịch online. Chỉ can thiệp thủ công nếu xác nhận được giao dịch đã thành công ngoài hệ thống.
                    </p>
                  }
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
                              ? "Chuyển khoản thủ công"
                              : "Tiền mặt thủ công",
                          title: "⚠ Xác nhận xử lý sự cố thanh toán",
                          description:
                            "CHỈ DÙNG KHI: khách đã chuyển khoản thành công nhưng hệ thống chưa ghi nhận, hoặc khách không thể thanh toán online và đã trả tiền trực tiếp. Staff phải kiểm tra sao kê ngân hàng trước khi xác nhận.",
                        })
                      }
                    >
                      <Receipt className="h-4 w-4" /> Xử lý thủ công
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-brand-600" />
            Hướng dẫn vận hành
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            <strong>1. Thu tiền mặt:</strong> Khi khách đến quầy, tìm booking trong mục `Thanh toán tiền mặt tại quầy`, bấm `Thu tiền mặt`, xác nhận. Sau đó mới check-in.
          </p>
          <p>
            <strong>2. Chờ online:</strong> Các booking trong mục `Chờ khách thanh toán online` sẽ tự chuyển sang `CONFIRMED` khi khách thanh toán thành công. Staff không cần làm gì.
          </p>
          <p>
            <strong>3. Sự cố online:</strong> Chỉ mở mục `Xử lý sự cố` khi khách báo đã chuyển khoản nhưng booking chưa được xác nhận. Kiểm tra sao kê kỹ trước khi xác nhận thủ công.
          </p>
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
              variant={pendingAction?.method === "CASH" ? "accent" : "danger"}
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
                <span className="font-medium">Phương thức xử lý:</span>{" "}
                {pendingAction.modeLabel}
              </p>
              <p className="mt-1 text-slate-600">
                Booking ID:{" "}
                <span className="font-mono">{pendingAction.bookingId}</span>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-amber-100 text-amber-800",
  BANK_TRANSFER: "bg-sky-100 text-sky-800",
  VNPAY: "bg-violet-100 text-violet-800",
};

function PaymentBookingCard({
  booking,
  action,
  extra,
  highlight,
}: {
  booking: Booking;
  action?: React.ReactNode;
  extra?: React.ReactNode;
  highlight?: "amber" | "rose";
}) {
  const highlightBorder =
    highlight === "amber"
      ? "border-l-[3px] border-l-amber-400"
      : highlight === "rose"
        ? "border-l-[3px] border-l-rose-300"
        : "";

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 ${highlightBorder}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            #{booking.bookingCode}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {(booking.customer?.firstName ?? "").trim()}{" "}
            {(booking.customer?.lastName ?? "").trim()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              booking.payment?.method
                ? METHOD_COLORS[booking.payment.method] ?? "bg-slate-100 text-slate-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {booking.payment?.method === "CASH" ? (
              <Banknote className="h-3.5 w-3.5" />
            ) : booking.payment?.method === "BANK_TRANSFER" ? (
              <Receipt className="h-3.5 w-3.5" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            {labelPaymentMethod(booking)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Phòng</p>
          <p className="font-medium text-slate-800">
            #{booking.room?.roomNumber ?? ""} -{" "}
            {booking.room?.roomType?.name ?? "Phòng"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tổng tiền</p>
          <p className="font-medium text-slate-800">
            {formatCurrency(booking.totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Email</p>
          <p className="font-medium text-slate-800">
            {booking.customer?.email ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Hạn thanh toán</p>
          <p className="font-medium text-slate-800">
            {booking.paymentDeadline
              ? formatDateTime(booking.paymentDeadline)
              : "-"}
          </p>
        </div>
      </div>

      {extra}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function labelPaymentMethod(booking: Booking) {
  switch (booking.payment?.method) {
    case "CASH":
      return "Tiền mặt";
    case "BANK_TRANSFER":
      return "Chuyển khoản";
    case "VNPAY":
      return "VNPay";
    case "VISA":
      return "VISA";
    default:
      return booking.payment?.method ?? "Chưa xác định";
  }
}

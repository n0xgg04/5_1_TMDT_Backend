"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  LogIn,
  LogOut,
  Calendar,
  User as UserIcon,
  BedDouble,
  Phone,
  Mail,
  Receipt,
  Wallet,
  XCircle,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/ui/badge";
import { OperationHeader } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/lib/types";

type BookingSearchResponse = {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
};

export default function StaffCheckInPage() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const search = useQuery<BookingSearchResponse>({
    queryKey: ["front-desk-bookings", searchTerm],
    enabled: Boolean(searchTerm),
    queryFn: () =>
      api
        .get("/bookings", {
          params: { search: searchTerm, limit: 10 },
        })
        .then((r) => r.data),
  });

  const booking = useQuery<Booking>({
    queryKey: ["booking-detail", bookingId],
    enabled: Boolean(bookingId),
    queryFn: () => api.get(`/bookings/${bookingId}`).then((r) => r.data),
  });

  const find = async () => {
    const normalized = keyword.trim();
    if (!normalized) {
      toast.warning("Vui lòng nhập thông tin khách hoặc mã đơn");
      return;
    }
    setBookingId(null);
    setSearchTerm(normalized);
  };

  const checkin = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/checkin`),
    onSuccess: () => {
      toast.success("Check-in thành công");
      qc.invalidateQueries({ queryKey: ["booking-detail"] });
    },
    onError: (e) => toast.error("Check-in thất bại", getApiErrorMessage(e)),
  });

  const checkout = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/checkout`),
    onSuccess: () => {
      toast.success("Check-out thành công");
      qc.invalidateQueries({ queryKey: ["booking-detail"] });
    },
    onError: (e) => toast.error("Check-out thất bại", getApiErrorMessage(e)),
  });

  const collectCash = useMutation({
    mutationFn: ({ id, method }: { id: string; method: "CASH" | "BANK_TRANSFER" }) =>
      api.post(`/payments/booking/${id}/manual-confirm`, { method }),
    onSuccess: () => {
      toast.success("Đã xác nhận thu tiền");
      qc.invalidateQueries({ queryKey: ["booking-detail"] });
    },
    onError: (e) => toast.error("Xác nhận thanh toán thất bại", getApiErrorMessage(e)),
  });

  const reopen = useMutation({
    mutationFn: (id: string) =>
      api.post(`/bookings/${id}/reopen`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã mở lại đơn thành công");
      qc.invalidateQueries({ queryKey: ["booking-detail"] });
      qc.invalidateQueries({ queryKey: ["front-desk-bookings"] });
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e);
      if (msg.includes("đã có người đặt")) {
        toast.error(
          "Không thể mở lại đơn",
          msg + "\nHãy tạo đơn mới cho khách với phòng khác còn trống.",
        );
      } else {
        toast.error("Không thể mở lại đơn", msg);
      }
    },
  });

  const cancelBooking = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã hủy đơn theo yêu cầu khách");
      qc.invalidateQueries({ queryKey: ["booking-detail"] });
      qc.invalidateQueries({ queryKey: ["front-desk-bookings"] });
    },
    onError: (e) =>
      toast.error("Không thể hủy đơn", getApiErrorMessage(e)),
  });

  return (
    <div>
      <OperationHeader
        kicker="Front desk"
        title="Check-in / Check-out"
        description="Tìm booking theo mã đơn, tên khách, email hoặc số điện thoại trên bill để lễ tân làm thủ tục nhận/trả phòng."
      />

      <Card className="mt-6">
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Thông tin tra cứu"
                placeholder="Nhập mã đơn, tên khách, email hoặc số điện thoại"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                onKeyDown={(e) => e.key === "Enter" && find()}
              />
            </div>
            <Button onClick={find} loading={search.isFetching}>
              <Search className="h-4 w-4" /> Tìm đơn
            </Button>
          </div>
        </CardContent>
      </Card>

      {search.isError && (
        <Card className="mt-5 border-rose-200 bg-rose-50">
          <CardContent>
            <p className="text-sm text-rose-700">
              Không thể tìm booking: {getApiErrorMessage(search.error)}
            </p>
          </CardContent>
        </Card>
      )}

      {search.data && (
        <Card className="mt-5">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Kết quả tìm kiếm</CardTitle>
              <p className="text-sm text-slate-500">
                {search.data.total} booking khớp thông tin
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {search.data.data.length === 0 ? (
              <p className="text-sm text-slate-500">
                Không tìm thấy booking phù hợp. Hãy thử lại bằng tên khách,
                email, số điện thoại hoặc mã đơn trên bill.
              </p>
            ) : (
              search.data.data.map((item) => {
                const activeStay =
                  item.status === "CONFIRMED" || item.status === "CHECKED_IN";
                const isCancelled = item.status === "CANCELLED";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBookingId(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      bookingId === item.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <BookingStatusBadge status={item.status} />
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                            <Receipt className="h-4 w-4" /> {item.bookingCode}
                          </span>
                        </div>
                        <p className="text-base font-semibold text-slate-900">
                          {(item.customer?.firstName ?? "").trim()} {(item.customer?.lastName ?? "").trim()}
                        </p>
                        <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-4 w-4" /> {item.customer?.phone ?? "Chưa có số điện thoại"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-4 w-4" /> {item.customer?.email ?? "Chưa có email"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BedDouble className="h-4 w-4" />
                            #{item.room?.roomNumber ?? ""} - {item.room?.roomType?.name ?? "Phòng"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(item.checkIn)} - {formatDate(item.checkOut)}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-slate-600 lg:text-right">
                        <p className="font-semibold text-brand-800">
                          {formatCurrency(item.totalAmount)}
                        </p>
                        <p className="mt-1">
                          {activeStay
                            ? "Sẵn sàng thao tác tại lễ tân"
                            : isCancelled
                              ? "Đơn đã hủy · có thể mở lại nếu phòng còn trống"
                              : "Booking này không thuộc luồng nhận/trả phòng"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {booking.isError && (
        <Card className="mt-5 border-rose-200 bg-rose-50">
          <CardContent>
            <p className="text-sm text-rose-700">
              Không tìm thấy đơn hoặc bạn không có quyền truy cập:{" "}
              {getApiErrorMessage(booking.error)}
            </p>
          </CardContent>
        </Card>
      )}

      {booking.data && (
        <Card className="mt-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chi tiết đơn</CardTitle>
              <BookingStatusBadge status={booking.data.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow
                icon={<UserIcon className="h-4 w-4" />}
                label="Khách"
                value={`${booking.data.customer?.firstName ?? ""} ${booking.data.customer?.lastName ?? ""}`}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Số điện thoại"
                value={booking.data.customer?.phone ?? "-"}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={booking.data.customer?.email ?? "-"}
              />
              <InfoRow
                icon={<BedDouble className="h-4 w-4" />}
                label="Phòng"
                value={`#${booking.data.room?.roomNumber ?? ""} - ${booking.data.room?.roomType?.name ?? ""}`}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Ngày nhận phòng"
                value={formatDate(booking.data.checkIn)}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Ngày trả phòng"
                value={formatDate(booking.data.checkOut)}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">Tổng tiền</p>
                <p className="text-2xl font-bold text-brand-800">
                  {formatCurrency(booking.data.totalAmount)}
                </p>
                {booking.data.payment && (
                  <p className="mt-1 text-sm text-slate-600">
                    Thanh toán: {booking.data.payment.status} ({booking.data.payment.method})
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {booking.data.status === "CONFIRMED" &&
                  booking.data.payment?.status !== "COMPLETED" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        collectCash.mutate({
                          id: booking.data!.id,
                          method:
                            booking.data.payment?.method === "BANK_TRANSFER"
                              ? "BANK_TRANSFER"
                              : "CASH",
                        })
                      }
                      loading={collectCash.isPending}
                    >
                  <Wallet className="h-4 w-4" /> Xác nhận đã thu tiền
                    </Button>
                  )}
                {booking.data.status === "CANCELLED" && (
                  <Button
                    variant="accent"
                    onClick={() => reopen.mutate(booking.data!.id)}
                    loading={reopen.isPending}
                  >
                    <LogIn className="h-4 w-4" /> Mở lại đơn
                  </Button>
                )}
                {[
                  "PENDING_HOST_APPROVAL",
                  "PENDING_PAYMENT",
                  "PAYING",
                  "CONFIRMED",
                ].includes(booking.data.status) && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      const reason = prompt(
                        "Lý do hủy (khách yêu cầu qua điện thoại):",
                      );
                      if (reason !== null) {
                        cancelBooking.mutate({
                          id: booking.data!.id,
                          reason: reason || "Hủy theo yêu cầu khách hàng",
                        });
                      }
                    }}
                    loading={cancelBooking.isPending}
                  >
                    <XCircle className="h-4 w-4" /> Hủy đơn
                  </Button>
                )}
                <Button
                  onClick={() => checkin.mutate(booking.data!.id)}
                  loading={checkin.isPending}
                  disabled={booking.data.status !== "CONFIRMED"}
                >
                  <LogIn className="h-4 w-4" /> Check-in
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => checkout.mutate(booking.data!.id)}
                  loading={checkout.isPending}
                  disabled={booking.data.status !== "CHECKED_IN"}
                >
                  <LogOut className="h-4 w-4" /> Check-out
                </Button>
              </div>
            </div>

            {booking.data.guestNotes && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="font-medium text-amber-800">Ghi chú khách:</p>
                <p className="mt-1 text-amber-700">{booking.data.guestNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
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
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

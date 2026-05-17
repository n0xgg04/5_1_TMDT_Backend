"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  CheckCircle2,
  CreditCard,
  Wallet,
  Banknote,
  Building2,
  Receipt,
  Clock,
  Baby,
  MessageSquare,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate, diffNights, cn } from "@/lib/utils";
import type { PaymentMethodInfo } from "@/lib/types";

interface RoomTypeDetail {
  id: string;
  name: string;
  description?: string | null;
  maxGuests: number;
  areaSqm: number;
  bedType: string;
  images: string[];
  amenities: string[];
}

type Method = "VNPAY" | "MOMO" | "CASH" | "BANK_TRANSFER" | "DEPOSIT";

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingInner />
    </Suspense>
  );
}

function BookingInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const roomTypeId = sp.get("roomTypeId") ?? "";
  const roomId = sp.get("roomId") ?? "";
  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const guests = Number(sp.get("guests") ?? 2);

  const [notes, setNotes] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [adults, setAdults] = useState(guests);
  const [children, setChildren] = useState(0);
  const [method, setMethod] = useState<Method>("VNPAY");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [bankInfo, setBankInfo] = useState<PaymentMethodInfo | null>(null);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(
        `/login?next=${encodeURIComponent("/booking?" + sp.toString())}`,
      );
    }
  }, [hydrated, user, router, sp]);

  const rt = useQuery({
    queryKey: ["roomType", roomTypeId],
    enabled: Boolean(roomTypeId),
    queryFn: () =>
      api.get<RoomTypeDetail>(`/rooms/types/${roomTypeId}`).then((r) => r.data),
  });

  const priceQ = useQuery({
    queryKey: [
      "bookingPrice",
      roomTypeId,
      checkIn,
      checkOut,
      adults + children,
    ],
    enabled: Boolean(roomTypeId && checkIn && checkOut),
    queryFn: () =>
      api
        .get("/search", {
          params: { checkIn, checkOut, guests: adults + children, roomTypeId },
        })
        .then((r) => r.data?.[0]),
  });

  const bankInfoQ = useQuery({
    queryKey: ["payment-methods"],
    enabled: method === "BANK_TRANSFER",
    queryFn: () =>
      api
        .get<PaymentMethodInfo[]>("/payment-methods")
        .then((r) => r.data?.[0] ?? null),
  });

  useEffect(() => {
    if (bankInfoQ.data) setBankInfo(bankInfoQ.data);
  }, [bankInfoQ.data]);

  const create = useMutation({
    mutationFn: () =>
      api
        .post("/bookings", {
          roomId,
          checkIn,
          checkOut,
          checkInTime,
          checkOutTime,
          adults,
          children,
          guestNotes: notes || undefined,
          specialRequests: specialRequests || undefined,
        })
        .then((r) => r.data),
    onSuccess: async (booking) => {
      toast.success("Tạo đơn thành công", `Mã đơn: ${booking.bookingCode}`);
      try {
        if (method === "BANK_TRANSFER") {
          if (!receiptUrl.trim()) {
            toast.info(
              "Vui lòng chuyển khoản và upload biên lai",
              `Số tiền: ${formatCurrency(total)}`,
            );
            return;
          }
          await api.post(`/bookings/${booking.id}/upload-receipt`, {
            receiptImageUrl: receiptUrl,
          });
          toast.success("Đã upload biên lai", "Đơn đang chờ staff xác nhận");
          router.push("/my-bookings");
          return;
        }

        const isDeposit = method === "DEPOSIT";
        const pay = await api
          .post("/payments/initiate", {
            bookingId: booking.id,
            method: isDeposit ? "VNPAY" : method,
            paymentType: isDeposit ? "DEPOSIT" : "FULL",
          })
          .then((r) => r.data);

        if (pay.gatewayUrl) {
          toast.info("Đang chuyển sang cổng thanh toán…");
          window.location.href = pay.gatewayUrl;
          return;
        }
        if (method === "CASH") {
          toast.info(
            "Vui lòng thanh toán tại quầy",
            "Đơn của bạn đã được tạo và đang chờ xác nhận.",
          );
        }
        router.push("/my-bookings");
      } catch (e) {
        toast.warning(
          "Không tạo được phiên thanh toán",
          "Vui lòng thử lại trong mục Đơn của tôi.",
        );
        router.push("/my-bookings");
      }
    },
    onError: (err) =>
      toast.error("Đặt phòng thất bại", getApiErrorMessage(err)),
  });

  if (!roomTypeId || !roomId || !checkIn || !checkOut) {
    return (
      <main className="container-page py-10">
        <Card>
          <CardContent>
            <p className="text-slate-700">
              Thiếu thông tin đặt phòng. Vui lòng quay lại và chọn phòng.
            </p>
            <div className="mt-4">
              <Button onClick={() => router.push("/rooms")}>Tìm phòng</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const nights = diffNights(checkIn, checkOut);
  const total = priceQ.data?.totalPrice ?? 0;
  const pricePerNight = priceQ.data?.pricePerNight ?? 0;
  const depositAmount = Math.floor(total * 0.3);

  return (
    <main className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Xác nhận đặt phòng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Vui lòng kiểm tra lại thông tin trước khi xác nhận
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lưu trú</CardTitle>
            </CardHeader>
            <CardContent>
              {rt.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : rt.data ? (
                <div className="flex gap-4">
                  <img
                    src={
                      rt.data.images[0] ||
                      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
                    }
                    alt={rt.data.name}
                    className="h-32 w-44 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {rt.data.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {rt.data.bedType} · {rt.data.areaSqm} m² · Tối đa{" "}
                      {rt.data.maxGuests} khách
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
                      <Stat
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Nhận phòng"
                        value={formatDate(checkIn)}
                      />
                      <Stat
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Trả phòng"
                        value={formatDate(checkOut)}
                      />
                      <Stat
                        icon={<Users className="h-4 w-4" />}
                        label="Khách"
                        value={`${adults + children} người`}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đặt phòng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Giờ nhận phòng
                  </label>
                  <Input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Giờ trả phòng
                  </label>
                  <Input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Người lớn
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Trẻ em
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Yêu cầu đặc biệt
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: View biển, không hút thuốc, giường extra..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Phòng tầng cao, gần thang máy…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <PayOption
                  active={method === "VNPAY"}
                  onClick={() => setMethod("VNPAY")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="VNPay"
                  desc="Thanh toán bằng ATM/Visa"
                />
                <PayOption
                  active={method === "DEPOSIT"}
                  onClick={() => setMethod("DEPOSIT")}
                  icon={<Wallet className="h-5 w-5" />}
                  title="Đặt cọc (30%)"
                  desc={`${formatCurrency(depositAmount)} để giữ phòng`}
                />
                <PayOption
                  active={method === "BANK_TRANSFER"}
                  onClick={() => setMethod("BANK_TRANSFER")}
                  icon={<Building2 className="h-5 w-5" />}
                  title="Chuyển khoản"
                  desc="CK ngân hàng + upload biên lai"
                />
                <PayOption
                  active={method === "CASH"}
                  onClick={() => setMethod("CASH")}
                  icon={<Banknote className="h-5 w-5" />}
                  title="Tại quầy"
                  desc="Thanh toán khi nhận phòng"
                />
              </div>

              {method === "BANK_TRANSFER" && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  {bankInfo ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-amber-900">
                        Thông tin chuyển khoản
                      </p>
                      <p className="text-amber-800">
                        Ngân hàng: {bankInfo.bankName}
                      </p>
                      <p className="text-amber-800">
                        Số TK: {bankInfo.accountNumber}
                      </p>
                      <p className="text-amber-800">
                        Chủ TK: {bankInfo.accountHolder}
                      </p>
                      <p className="text-amber-800">
                        Số tiền: {formatCurrency(total)}
                      </p>
                      <p className="text-amber-800">
                        Nội dung: Đặt phòng Sapphire Stay
                      </p>
                      <Input
                        className="mt-2"
                        placeholder="Dán link ảnh biên lai chuyển khoản"
                        value={receiptUrl}
                        onChange={(e) => setReceiptUrl(e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-amber-800">
                      Đang tải thông tin TK ngân hàng…
                    </p>
                  )}
                </div>
              )}

              {method === "DEPOSIT" && (
                <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                  <p className="font-semibold">
                    Bạn sẽ thanh toán trước {formatCurrency(depositAmount)}{" "}
                    (30%) qua VNPay.
                  </p>
                  <p className="mt-1">
                    Số tiền còn lại {formatCurrency(total - depositAmount)} sẽ
                    thanh toán khi check-in.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Tóm tắt đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row
                label={`${formatCurrency(pricePerNight)} × ${nights} đêm`}
                value={formatCurrency(pricePerNight * nights)}
              />
              <Row label="Phí dịch vụ" value="Miễn phí" />
              {method === "DEPOSIT" && (
                <Row
                  label="Đặt cọc (30%)"
                  value={formatCurrency(depositAmount)}
                />
              )}
              <div className="border-t border-slate-100 pt-3">
                <Row bold label="Tổng cộng" value={formatCurrency(total)} />
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={create.isPending}
                disabled={
                  !user ||
                  priceQ.isLoading ||
                  (method === "BANK_TRANSFER" &&
                    !receiptUrl.trim() &&
                    bankInfo !== null)
                }
                onClick={() => create.mutate()}
              >
                <CheckCircle2 className="h-4 w-4" /> Xác nhận đặt phòng
              </Button>
              <p className="text-xs text-slate-500">
                Đơn sẽ được staff xác nhận sau khi thanh toán. Vui lòng kiểm tra
                email/SMS.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon} {label}
      </p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-sm",
          bold ? "font-semibold text-slate-900" : "text-slate-600",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          bold ? "text-lg font-bold text-brand-700" : "text-sm text-slate-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-200"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

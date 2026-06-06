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
  Banknote,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  BedDouble,
  Clock,
  Tag,
  MapPin,
  X,
  Loader2,
  Ticket,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate, diffNights, cn } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import type { UserPaymentMethod, UserCoupon } from "@/lib/types";

interface PricingRule {
  id: string;
  roomTypeId: string;
  type: string;
  pricePerNight: string | number;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  isActive: boolean;
}

interface RoomTypeDetail {
  id: string;
  name: string;
  description?: string | null;
  maxGuests: number;
  areaSqm: number;
  bedType: string;
  images: string[];
  amenities: string[];
  pricingRules: PricingRule[];
  rooms?: { branch?: { name: string; city: string } }[];
}

function calcTotalFromRules(
  rules: PricingRule[] | undefined,
  checkInStr: string,
  checkOutStr: string,
): number {
  if (!rules || rules.length === 0) return 0;
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const nights = Math.max(
    1,
    Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  let total = 0;
  for (let i = 0; i < nights; i++) {
    const date = new Date(checkIn);
    date.setDate(date.getDate() + i);
    const applicable = rules
      .filter((r) => {
        if (!r.isActive) return false;
        if (r.startDate === null && r.endDate === null) return true;
        const s = r.startDate ? new Date(r.startDate) : null;
        const e = r.endDate ? new Date(r.endDate) : null;
        return (
          (s === null || s.getTime() <= date.getTime()) &&
          (e === null || e.getTime() >= date.getTime())
        );
      })
      .sort((a, b) => b.priority - a.priority);
    total += Number(applicable[0]?.pricePerNight ?? 0);
  }
  return total;
}

type PayMode = "FULL" | "CASH" | "BANK_TRANSFER";

const SPECIAL_REQUESTS_OPTIONS = [
  { key: "non_smoking", label: "Phòng không hút thuốc" },
  { key: "connecting", label: "Phòng liên thông" },
  { key: "high_floor", label: "Tầng cao" },
];

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

  const [contactName, setContactName] = useState(
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
  );
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [guestName, setGuestName] = useState(
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
  );
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [otherRequests, setOtherRequests] = useState("");
  const [insurance, setInsurance] = useState(false);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [adults, setAdults] = useState(guests);
  const [children, setChildren] = useState(0);
  const [payMode, setPayMode] = useState<PayMode>("FULL");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [appliedManualCode, setAppliedManualCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(30);
  const [qrBookingId, setQrBookingId] = useState<string | null>(null);

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
      api
        .get<RoomTypeDetail>(`/rooms/types/${roomTypeId}/public`)
        .then((r) => r.data),
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
        .then((r) => r.data?.data?.[0]),
  });

  const userMethodsQ = useQuery({
    queryKey: ["user-payment-methods"],
    enabled: Boolean(user && payMode !== "CASH" && payMode !== "BANK_TRANSFER"),
    queryFn: () =>
      api.get<UserPaymentMethod[]>("/user-payment-methods").then((r) => r.data),
  });

  const myCouponsQ = useQuery({
    queryKey: ["my-coupons-booking"],
    enabled: Boolean(user),
    queryFn: () =>
      api.get<UserCoupon[]>("/coupons/my-coupons").then((r) => r.data),
  });

  useEffect(() => {
    if (user) {
      setContactName(`${user.firstName} ${user.lastName}`);
      setContactPhone(user.phone ?? "");
      setContactEmail(user.email ?? "");
      setGuestName(`${user.firstName} ${user.lastName}`);
    }
  }, [user]);

  useEffect(() => {
    if (!showQrModal || qrCountdown <= 0) return;
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showQrModal, qrCountdown]);

  const nights = diffNights(checkIn, checkOut);
  const fallbackTotal = calcTotalFromRules(
    rt.data?.pricingRules,
    checkIn,
    checkOut,
  );
  const total = priceQ.data?.totalPrice ?? fallbackTotal;
  const pricePerNight =
    priceQ.data?.pricePerNight ?? (nights > 0 ? fallbackTotal / nights : 0);
  const vat = Math.floor((total - discount) * 0.1);
  const finalTotal = total - discount + vat + (insurance ? 43500 : 0);

  useEffect(() => {
    console.log("[Booking Debug]", {
      priceQData: priceQ.data,
      rtPricingRules: rt.data?.pricingRules,
      fallbackTotal,
      total,
      pricePerNight,
      nights,
      checkIn,
      checkOut,
    });
  }, [
    priceQ.data,
    rt.data?.pricingRules,
    fallbackTotal,
    total,
    pricePerNight,
    nights,
    checkIn,
    checkOut,
  ]);

  const applyCoupon = useMutation({
    mutationFn: async (coupon: UserCoupon) => {
      const res = await api
        .post("/coupons/apply", { code: coupon.coupon.code, amount: total })
        .then((r) => r.data);
      setDiscount(res.discount);
      setSelectedCoupon(coupon);
      setCouponError(null);
      toast.success(
        `Đã áp dụng ${coupon.coupon.code}`,
        `Giảm ${formatCurrency(res.discount)}`,
      );
    },
    onError: (err) => {
      setDiscount(0);
      setSelectedCoupon(null);
      setCouponError(getApiErrorMessage(err));
      toast.error("Mã giảm giá không hợp lệ", getApiErrorMessage(err));
    },
  });

  const applyManualCoupon = useMutation({
    mutationFn: async (code: string) => {
      const res = await api
        .post("/coupons/apply", {
          code: code.trim().toUpperCase(),
          amount: total,
        })
        .then((r) => r.data);
      setDiscount(res.discount);
      setAppliedManualCode(res.code);
      setCouponError(null);
      setManualCouponCode("");
      toast.success(
        `Đã áp dụng ${res.code}`,
        `Giảm ${formatCurrency(res.discount)}`,
      );
      return res;
    },
    onError: (err) => {
      setDiscount(0);
      setSelectedCoupon(null);
      setAppliedManualCode("");
      setCouponError(getApiErrorMessage(err));
      toast.error("Mã giảm giá không hợp lệ", getApiErrorMessage(err));
    },
  });

  const clearCoupon = () => {
    setSelectedCoupon(null);
    setDiscount(0);
    setCouponError(null);
    setManualCouponCode("");
    setAppliedManualCode("");
  };

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
          guestNotes: otherRequests || undefined,
          specialRequests: selectedRequests.join(", ") || undefined,
          couponCode:
            selectedCoupon?.coupon.code || appliedManualCode || undefined,
          paymentMethodId: selectedMethodId || undefined,
          payMode,
        })
        .then((r) => r.data),
    onSuccess: async (booking) => {
      toast.success("Tạo đơn thành công", `Mã đơn: ${booking.bookingCode}`);
      try {
        if (payMode === "BANK_TRANSFER") {
          setQrBookingId(booking.id);
          setShowQrModal(true);
          setQrCountdown(30);
          return;
        }
        if (payMode === "CASH") {
          toast.info(
            "Đơn đã được tạo",
            "Vui lòng thanh toán khi nhận phòng. Đơn đang chờ duyệt.",
          );
          router.push("/my-bookings");
          return;
        }

        const selectedMethod = userMethodsQ.data?.find(
          (m) => m.id === selectedMethodId,
        );
        const methodType = selectedMethod?.type ?? "VNPAY";

        if (methodType === "VISA") {
          const { clientSecret } = await api
            .post("/payments/stripe/payment-intent", {
              bookingId: booking.id,
              paymentMethodId: selectedMethodId,
            })
            .then((r) => r.data);

          const stripe = await loadStripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
          );
          if (!stripe) {
            throw new Error("Stripe chưa sẵn sàng");
          }

          const result = await stripe.confirmCardPayment(clientSecret);

          if (result.error) {
            throw new Error(result.error.message ?? "Thanh toán thất bại");
          }

          await api.post("/payments/stripe/confirm-payment", {
            paymentIntentId: result.paymentIntent.id,
          });

          toast.success(
            "Thanh toán thành công",
            "Đơn đặt phòng đã được xác nhận",
          );
          router.push("/my-bookings");
          return;
        }

        const payRes = await api
          .post("/payments/initiate", {
            bookingId: booking.id,
            method: methodType,
            paymentType: payMode,
          })
          .then((r) => r.data);
        if (payRes.gatewayUrl) {
          toast.info("Đang chuyển sang cổng thanh toán…");
          window.location.href = payRes.gatewayUrl;
          return;
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

  const savedMethods = userMethodsQ.data ?? [];
  const availableCoupons = (myCouponsQ.data ?? []).filter((c) => !c.isUsed);

  const toggleRequest = (key: string) => {
    setSelectedRequests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <main className="container-page py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-brand-600">1. Review</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="font-bold text-slate-900">2. Pay</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Thông tin đặt phòng
              </h2>
              <p className="text-sm text-slate-500">
                Vui lòng điền đầy đủ thông tin để nhận xác nhận đặt phòng.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <Input
                    leftIcon={<User className="h-4 w-4" />}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      leftIcon={<Phone className="h-4 w-4" />}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+84"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      leftIcon={<Mail className="h-4 w-4" />}
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-slate-900">Yêu cầu</h2>
              <p className="text-sm text-slate-500">
                Điền thông tin khách lưu trú.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Họ và tên khách <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    leftIcon={<User className="h-4 w-4" />}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Yêu cầu đặc biệt
                  </label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {SPECIAL_REQUESTS_OPTIONS.map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(opt.key)}
                          onChange={() => toggleRequest(opt.key)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Yêu cầu khác
                  </label>
                  <textarea
                    rows={2}
                    value={otherRequests}
                    onChange={(e) => setOtherRequests(e.target.value)}
                    placeholder="Các yêu cầu khác..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Phương thức thanh toán
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PayOption
                  active={payMode === "FULL"}
                  onClick={() => setPayMode("FULL")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Thanh toán ngay"
                  desc="Trả toàn bộ"
                />
                <PayOption
                  active={payMode === "BANK_TRANSFER"}
                  onClick={() => setPayMode("BANK_TRANSFER")}
                  icon={<Building2 className="h-5 w-5" />}
                  title="Chuyển khoản"
                  desc="Quét mã QR"
                />
                <PayOption
                  active={payMode === "CASH"}
                  onClick={() => setPayMode("CASH")}
                  icon={<Banknote className="h-5 w-5" />}
                  title="Tại quầy"
                  desc="Thanh toán khi nhận phòng"
                />
              </div>

              {payMode === "FULL" && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    Chọn phương thức
                  </p>
                  {savedMethods.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                      Bạn chưa có phương thức thanh toán.
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/profile")}
                      >
                        <Plus className="h-3.5 w-3.5" /> Thêm ngay
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {savedMethods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethodId(m.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                          selectedMethodId === m.id
                            ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                            : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <CreditCard className="h-5 w-5 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {m.label}
                          </p>
                          <p className="text-xs text-slate-500">{m.type}</p>
                        </div>
                        {m.isDefault && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Mặc định
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/profile")}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Thêm phương thức thanh
                    toán
                  </Button>
                </div>
              )}

              {payMode === "BANK_TRANSFER" && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold text-amber-900">
                    Thanh toán qua chuyển khoản
                  </p>
                  <p className="mt-1">
                    Sau khi đặt phòng, bạn sẽ được chuyển đến mã QR để thanh
                    toán.
                  </p>
                </div>
              )}

              {payMode === "CASH" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold">Thanh toán khi nhận phòng</p>
                  <p className="mt-1">
                    Bạn sẽ thanh toán toàn bộ {formatCurrency(finalTotal)} tại
                    quầy lễ tân. Đơn sẽ được staff duyệt sau khi bạn đến.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Hotel Summary
              </h2>
              {rt.isLoading ? (
                <Skeleton className="mt-3 h-24 w-full" />
              ) : rt.data ? (
                <div className="mt-3 flex gap-3">
                  <img
                    src={
                      rt.data.images[0] ||
                      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
                    }
                    alt={rt.data.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {rt.data.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {rt.data.rooms?.[0]?.branch?.city ?? "Việt Nam"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <BedDouble className="h-3.5 w-3.5" /> {rt.data.bedType}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>
                    Nhận: {formatDate(checkIn)} ({checkInTime})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>
                    Trả: {formatDate(checkOut)} ({checkOutTime})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>
                    {adults} người lớn
                    {children > 0 ? `, ${children} trẻ em` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{nights} đêm</span>
                </div>
                {selectedRequests.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span>
                      {selectedRequests
                        .map(
                          (k) =>
                            SPECIAL_REQUESTS_OPTIONS.find((o) => o.key === k)
                              ?.label,
                        )
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                <Row
                  label={`Phòng × ${nights} đêm`}
                  value={formatCurrency(total)}
                />
                {discount > 0 && (
                  <Row
                    label={`Giảm giá (${selectedCoupon?.coupon.code})`}
                    value={`-${formatCurrency(discount)}`}
                  />
                )}
                <Row label="Thuế VAT (10%)" value={formatCurrency(vat)} />
                {insurance && (
                  <Row label="Bảo hiểm du lịch" value={formatCurrency(43500)} />
                )}
                <div className="border-t border-slate-100 pt-2">
                  <Row
                    bold
                    label="Tổng cộng"
                    value={formatCurrency(finalTotal)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Áp dụng ưu đãi
                </label>

                {discount > 0 ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">
                        {selectedCoupon?.coupon.code ?? appliedManualCode}
                      </span>
                      <span className="text-xs text-emerald-600">
                        -{formatCurrency(discount)}
                      </span>
                    </div>
                    <button
                      onClick={clearCoupon}
                      className="rounded p-1 text-emerald-600 hover:bg-emerald-100"
                      title="Bỏ mã"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={manualCouponCode}
                        onChange={(e) => {
                          setManualCouponCode(e.target.value);
                          setCouponError(null);
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          !manualCouponCode.trim() ||
                          applyManualCoupon.isPending ||
                          total <= 0
                        }
                        onClick={() =>
                          applyManualCoupon.mutate(manualCouponCode)
                        }
                      >
                        {applyManualCoupon.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="mt-1 text-xs text-rose-500">
                        {couponError}
                      </p>
                    )}

                    {availableCoupons.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs text-slate-500">
                          Hoặc chọn từ mã đã lưu
                        </p>
                        <select
                          value={selectedCoupon?.id ?? ""}
                          onChange={(e) => {
                            const c = availableCoupons.find(
                              (x) => x.id === e.target.value,
                            );
                            if (c) applyCoupon.mutate(c);
                            else clearCoupon();
                          }}
                          disabled={applyCoupon.isPending}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 disabled:opacity-50"
                        >
                          <option value="">Chọn mã giảm giá</option>
                          {availableCoupons.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.coupon.code} —{" "}
                              {c.coupon.type === "percentage"
                                ? `Giảm ${c.coupon.value}%`
                                : `Giảm ${formatCurrency(Number(c.coupon.value))}`}
                              {c.coupon.minAmount
                                ? ` (tối thiểu ${formatCurrency(Number(c.coupon.minAmount))})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Button
                size="lg"
                className="mt-4 w-full"
                loading={create.isPending}
                disabled={
                  !user ||
                  priceQ.isLoading ||
                  !contactName ||
                  !contactPhone ||
                  !contactEmail ||
                  !guestName ||
                  (payMode === "FULL" && !selectedMethodId)
                }
                onClick={() => create.mutate()}
              >
                <CheckCircle2 className="h-4 w-4" /> Đặt phòng
              </Button>
              <p className="mt-2 text-xs text-slate-500 text-center">
                Bằng việc tiếp tục, bạn đồng ý với Điều khoản & Chính sách bảo
                mật.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            {qrCountdown > 0 ? (
              <>
                <h3 className="text-center text-lg font-bold text-slate-900">
                  Quét mã để thanh toán
                </h3>
                <p className="mt-1 text-center text-sm text-slate-500">
                  Số tiền: {formatCurrency(finalTotal)}
                </p>
                <div className="mt-4 flex justify-center">
                  <img
                    src="https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg"
                    alt="QR Code"
                    className="h-48 w-48 rounded-xl border border-slate-200"
                  />
                </div>
                <p className="mt-4 text-center text-sm text-slate-600">
                  Tự động xác nhận sau{" "}
                  <span className="font-bold text-brand-700">
                    {qrCountdown}s
                  </span>
                </p>
                <Button
                  variant="ghost"
                  className="mt-3 w-full"
                  onClick={() => {
                    setShowQrModal(false);
                    setQrCountdown(30);
                  }}
                >
                  Hủy
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Thanh toán thành công
                  </h3>
                  <p className="mt-1 text-center text-sm text-slate-500">
                    Đơn đặt phòng của bạn đã được xác nhận.
                  </p>
                </div>
                <Button
                  className="mt-6 w-full"
                  onClick={() => router.push("/my-bookings")}
                >
                  Phòng đã đặt
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
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
        "flex flex-col gap-2 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-200"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold text-slate-900">{title}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

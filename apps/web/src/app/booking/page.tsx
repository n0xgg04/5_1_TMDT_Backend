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
import {
  BookingStatePanel,
  SectionHeading,
  hotelFallbackImage,
} from "@/components/hotel/commercial";
import {
  BookingConflictDialog,
  type BookingConflictDialogData,
} from "@/components/booking/booking-conflict-dialog";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate, diffNights, cn } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import type {
  RangeAvailabilityResponse,
  UserPaymentMethod,
  UserCoupon,
} from "@/lib/types";

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
  const [conflictDialog, setConflictDialog] =
    useState<BookingConflictDialogData | null>(null);

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

  const rangeAvailabilityQ = useQuery({
    queryKey: ["booking-range-availability", roomId, checkIn, checkOut],
    enabled: Boolean(roomId && checkIn && checkOut),
    queryFn: () =>
      api
        .get<RangeAvailabilityResponse>("/availability/check", {
          params: { roomId, from: checkIn, to: checkOut },
        })
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

  const findOtherHref = `/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${adults + children}`;

  const openConflictDialog = (
    message?: string,
    conflicts = rangeAvailabilityQ.data?.conflicts ?? [],
  ) => {
    setConflictDialog({
      title: "Khoảng ngày này chưa thể đặt",
      message,
      selectedFrom: checkIn,
      selectedTo: checkOut,
      conflicts,
      findOtherHref,
    });
  };

  const isBookingConflictMessage = (message: string) =>
    message.includes("Phòng đã được đặt") ||
    message.includes("Ngày trả phòng") ||
    message.includes("Ngày không hợp lệ") ||
    message.includes("Khoảng ngày");

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
        })
        .then((r) => r.data),
    onSuccess: (booking) => {
      toast.success(
        "Đã gửi yêu cầu đặt chỗ",
        `Mã đơn: ${booking.bookingCode}. Vui lòng chờ duyệt trong 24 giờ.`,
      );
      router.push(`/my-bookings/${booking.id}`);
    },
    onError: (err) => {
      const message = getApiErrorMessage(err);
      if (isBookingConflictMessage(message)) {
        openConflictDialog(message);
        return;
      }
      toast.error("Đặt phòng thất bại", message);
    },
  });

  const submitBookingRequest = () => {
    if (rangeAvailabilityQ.data && !rangeAvailabilityQ.data.available) {
      openConflictDialog(undefined, rangeAvailabilityQ.data.conflicts);
      return;
    }
    if (rangeAvailabilityQ.error) {
      openConflictDialog(getApiErrorMessage(rangeAvailabilityQ.error));
      return;
    }
    create.mutate();
  };

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
    <main className="customer-page">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-8">
          <SectionHeading
            kicker="Hoàn tất đặt phòng"
            title="Xác nhận thông tin lưu trú"
            description="Vui lòng kiểm tra kỹ thông tin bên dưới. Sau khi gửi yêu cầu, chúng tôi sẽ phản hồi trong vòng 24 giờ."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Step active title="1. Điền thông tin" desc="Xác nhận thông tin liên hệ & yêu cầu đặc biệt." />
            <Step active title="2. Xác nhận & gửi" desc="Đội ngũ chúng tôi kiểm tra và phản hồi trong 24h." />
            <Step title="3. Thanh toán & nhận phòng" desc="Thanh toán an toàn và nhận phòng dễ dàng." />
          </div>
        </div>
      </section>

      <div className="container-page grid grid-cols-1 gap-6 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-ink-950">
                Thông tin liên hệ
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Chúng tôi sẽ sử dụng những thông tin này để liên hệ xác nhận và hỗ trợ bạn trong suốt quá trình đặt phòng.
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

          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <h2 className="text-lg font-bold text-ink-950">Thông tin khách lưu trú</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Vui lòng nhập chính xác họ tên người sẽ đến nhận phòng. Bạn có thể thêm các yêu cầu đặc biệt để chúng tôi chuẩn bị tốt nhất.
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

          <BookingStatePanel
            status="PENDING_HOST_APPROVAL"
            title="Vui lòng chờ xác nhận từ chúng tôi"
            description="Đội ngũ Sapphire Stay sẽ kiểm tra lịch phòng và phản hồi trong vòng 24 giờ. Bạn sẽ nhận được email và thông báo ngay khi yêu cầu được duyệt."
          />
        </div>

        <div>
          <Card className="sticky top-24 overflow-hidden">
            <div className="bg-ink-950 p-5 text-white">
              <p className="text-sm text-white/70">Tổng chi phí dự kiến</p>
              {priceQ.isLoading && !priceQ.data ? (
                <div className="mt-2 h-8 w-40 animate-pulse rounded bg-white/20" />
              ) : (
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(total)}
                </p>
              )}
              <p className="mt-1 text-xs text-white/70">
                Giá cuối cùng sẽ được xác nhận sau khi duyệt
              </p>
            </div>
            <CardContent className="p-5">
              {rt.isLoading ? (
                <Skeleton className="mt-3 h-24 w-full" />
              ) : rt.data ? (
                <div className="flex gap-3">
                  <img
                    src={
                      rt.data.images[0] ||
                      hotelFallbackImage(rt.data.name)
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

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {priceQ.isLoading && !priceQ.data ? (
                  <div className="space-y-2">
                    <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                  </div>
                ) : (
                  <>
                    <Row
                      label={`${rt.data?.name ?? "Phòng"} · ${nights} đêm`}
                      value={formatCurrency(total)}
                    />
                    <div className="border-t border-slate-100 pt-2">
                      <Row
                        bold
                        label="Tổng dự kiến"
                        value={formatCurrency(total)}
                      />
                    </div>
                  </>
                )}
              </div>

              <p className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs leading-5 text-brand-800">
                Bạn sẽ chọn phương thức thanh toán và áp dụng mã giảm giá sau khi yêu cầu được duyệt.
              </p>

              {rangeAvailabilityQ.data &&
                !rangeAvailabilityQ.data.available && (
                  <div className="mt-4 rounded-lg border border-coral-200 bg-coral-50 p-3 text-sm text-coral-800">
                    Rất tiếc, khoảng thời gian này đã có khách đặt hoặc đang được giữ. Vui lòng chọn ngày khác.
                  </div>
                )}

              <Button
                size="lg"
                variant="accent"
                className="mt-4 w-full"
                loading={create.isPending}
                disabled={
                  !user ||
                  priceQ.isLoading ||
                  rangeAvailabilityQ.isLoading ||
                  !contactName ||
                  !contactPhone ||
                  !contactEmail ||
                  !guestName
                }
                onClick={submitBookingRequest}
              >
                <CheckCircle2 className="h-4 w-4" /> Hoàn tất gửi yêu cầu
              </Button>
              <p className="mt-2 text-xs text-slate-400 text-center">
                Bằng cách gửi yêu cầu, bạn đồng ý với Điều khoản sử dụng & Chính sách bảo mật của chúng tôi.
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

      <BookingConflictDialog
        open={Boolean(conflictDialog)}
        data={conflictDialog}
        onClose={() => setConflictDialog(null)}
        onChooseDates={() => router.back()}
        onFindOther={() => {
          if (conflictDialog?.findOtherHref) {
            router.push(conflictDialog.findOtherHref);
          }
        }}
      />
    </main>
  );
}

function Step({
  active,
  title,
  desc,
}: {
  active?: boolean;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        active
          ? "border-brand-200 bg-brand-50 text-brand-950"
          : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5">{desc}</p>
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

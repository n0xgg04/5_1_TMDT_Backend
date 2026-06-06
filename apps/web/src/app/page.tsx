"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Search,
  Users,
  Shield,
  Sparkles,
  Wifi,
  Star,
  Phone,
  Mail,
  ArrowUp,
  Clock,
  Flame,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/lib/auth-store";
import type { HotelBranch, Coupon } from "@/lib/types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&auto=format&fit=crop&q=80";

const PROVINCES = [
  {
    name: "Hà Nội",
    img: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "TP. Hồ Chí Minh",
    img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Đà Nẵng",
    img: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Nha Trang",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Đà Lạt",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Phú Quốc",
    img: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&auto=format&fit=crop&q=80",
  },
];

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [checkIn, setCheckIn] = useState(todayISO(1));
  const [checkOut, setCheckOut] = useState(todayISO(2));
  const [guests, setGuests] = useState(2);
  const [province, setProvince] = useState("");

  const featuredQ = useQuery({
    queryKey: ["featured-rooms"],
    queryFn: () => api.get("/search/featured").then((r) => r.data),
  });

  const flashQ = useQuery({
    queryKey: ["flash-sales"],
    queryFn: () => api.get("/search/flash-sales").then((r) => r.data),
  });

  const couponsQ = useQuery({
    queryKey: ["active-coupons"],
    queryFn: () => api.get<Coupon[]>("/coupons").then((r) => r.data),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    if (province) qs.set("province", province);
    router.push(`/rooms?${qs.toString()}`);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 text-white">
        <Image
          src={HERO_IMG}
          alt="Sapphire Stay Hotel"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40" />
        <div className="container-page relative py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" /> Toàn quốc · Việt Nam
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Kỳ nghỉ đáng nhớ bắt đầu tại{" "}
              <span className="text-sky-200">Sapphire Stay</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-sky-100/90">
              Đặt phòng khách sạn trực tuyến nhanh chóng, an toàn. Hơn 200 phòng
              hạng sang với đầy đủ tiện nghi và dịch vụ tận tâm 24/7.
            </p>
          </div>
          <form
            onSubmit={submit}
            className="mt-10 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5 sm:grid-cols-5"
          >
            <Field
              icon={<CalendarDays className="h-4 w-4" />}
              label="Nhận phòng"
            >
              <input
                type="date"
                value={checkIn}
                min={todayISO()}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 focus:ring-0"
              />
            </Field>
            <Field
              icon={<CalendarDays className="h-4 w-4" />}
              label="Trả phòng"
            >
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 focus:ring-0"
              />
            </Field>
            <Field icon={<Users className="h-4 w-4" />} label="Số khách">
              <select
                value={guests}
                onChange={(e) => setGuests(+e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 focus:ring-0"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} khách
                  </option>
                ))}
              </select>
            </Field>
            <Field icon={<MapPin className="h-4 w-4" />} label="Khu vực">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 focus:ring-0"
              >
                <option value="">Toàn quốc</option>
                {PROVINCES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" size="lg" className="sm:h-auto">
              <Search className="h-4 w-4" /> Tìm phòng
            </Button>
          </form>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold text-slate-900">
          Khám phá theo địa điểm
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PROVINCES.map((p) => (
            <button
              key={p.name}
              onClick={() =>
                router.push(`/rooms?province=${encodeURIComponent(p.name)}`)
              }
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <img
                src={p.img}
                alt={p.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
              <p className="absolute bottom-3 left-3 text-sm font-bold text-white">
                {p.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-amber-50 py-16">
        <div className="container-page">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900">Phòng 5 sao</h2>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredQ.data
              ?.filter((rt: any) => rt.starRating === 5)
              .map((rt: any) => (
                <Link
                  key={rt.id}
                  href={`/rooms/${rt.id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        rt.images?.[0] ||
                        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
                      }
                      alt={rt.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-amber-600">
                      <Star className="h-3 w-3 fill-current" /> 5.0
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {rt.branch?.city || "Việt Nam"} · {rt.bedType}
                    </p>
                    <p className="mt-2 text-lg font-bold text-brand-700">
                      {formatCurrency(rt.pricePerNight)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / đêm
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            {(!featuredQ.data ||
              featuredQ.data.filter((rt: any) => rt.starRating === 5).length ===
                0) &&
              featuredQ.data?.slice(0, 3).map((rt: any) => (
                <Link
                  key={rt.id}
                  href={`/rooms/${rt.id}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        rt.images?.[0] ||
                        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
                      }
                      alt={rt.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-amber-600">
                      <Star className="h-3 w-3 fill-current" />{" "}
                      {rt.starRating ?? 5}.0
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {rt.branch?.city || "Việt Nam"} · {rt.bedType}
                    </p>
                    <p className="mt-2 text-lg font-bold text-brand-700">
                      {formatCurrency(rt.pricePerNight)}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / đêm
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {flashQ.data && flashQ.data.length > 0 && (
        <section className="bg-rose-50 py-16">
          <div className="container-page">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-rose-500" />
              <h2 className="text-2xl font-bold text-slate-900">Flash Sale</h2>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {flashQ.data.map((fs: any) => (
                <Link
                  key={fs.id}
                  href={`/rooms/${fs.roomTypeId}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        fs.roomTypeImages?.[0] ||
                        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
                      }
                      alt={fs.roomTypeName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2 rounded-lg bg-rose-500 px-2 py-1 text-xs font-bold text-white">
                      -{fs.discount}%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900">
                      {fs.roomTypeName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Còn {fs.quantity - fs.soldCount} suất
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold text-slate-900">Phòng nổi bật</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredQ.data?.map((rt: any) => (
            <Link
              key={rt.id}
              href={`/rooms/${rt.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={
                    rt.images?.[0] ||
                    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&auto=format&fit=crop&q=80"
                  }
                  alt={rt.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-amber-600">
                  <Star className="h-3 w-3 fill-current" /> 5.0
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {rt.branch?.city || "Việt Nam"} · {rt.bedType}
                </p>
                <p className="mt-2 text-lg font-bold text-brand-700">
                  {formatCurrency(rt.pricePerNight)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / đêm
                  </span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {couponsQ.data && couponsQ.data.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="container-page">
            <div className="flex items-center gap-2">
              <Ticket className="h-6 w-6 text-brand-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                Các chương trình ưu đãi
              </h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {couponsQ.data.slice(0, 4).map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  user={user}
                  onClaim={() =>
                    qc.invalidateQueries({ queryKey: ["active-coupons"] })
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Vì sao chọn Sapphire Stay?
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Shield className="h-6 w-6" />}
            title="Thanh toán an toàn"
            desc="Tích hợp VNPay & MoMo với mã hóa đầu cuối."
          />
          <Feature
            icon={<Sparkles className="h-6 w-6" />}
            title="Dịch vụ đẳng cấp"
            desc="Đội ngũ nhân viên chuyên nghiệp, phòng dọn dẹp sạch sẽ."
          />
          <Feature
            icon={<Wifi className="h-6 w-6" />}
            title="Tiện nghi đầy đủ"
            desc="Wifi tốc độ cao, TV màn hình lớn, mini-bar 5 sao."
          />
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-900 py-12 text-slate-300">
        <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-white">Sapphire Stay</p>
            <p className="mt-2 text-sm">
              Hệ thống đặt phòng khách sạn trực tuyến hàng đầu Việt Nam.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Về chúng tôi</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/rooms" className="hover:text-white">
                  Tìm phòng
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-white">
                  Đơn của tôi
                </Link>
              </li>
              <li>
                <Link href="/my-coupons" className="hover:text-white">
                  Ưu đãi
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Hỗ trợ</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> 1900 1234
              </li>
              <li className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> support@sapphirestay.com
              </li>
              <li className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> 123 Phố Huế, Hà Nội
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Chính sách</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>Điều khoản sử dụng</li>
              <li>Chính sách bảo mật</li>
              <li>Chính sách hủy</li>
            </ul>
          </div>
        </div>
        <div className="container-page mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Sapphire Stay · Nhóm 01 · PTIT
        </div>
      </footer>

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-colors focus-within:border-brand-500 focus-within:bg-white">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </label>
  );
}

function CouponCard({
  coupon,
  user,
  onClaim,
}: {
  coupon: Coupon;
  user: { id: string } | null;
  onClaim: () => void;
}) {
  const claimM = useMutation({
    mutationFn: (id: string) =>
      api.post(`/coupons/${id}/claim`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã lưu mã ưu đãi");
      onClaim();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-brand-700">
          {coupon.type === "percentage"
            ? `${coupon.value}%`
            : formatCurrency(coupon.value)}
        </p>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
          {coupon.code}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {coupon.type === "percentage" ? "Giảm" : "Giảm"}{" "}
        {coupon.type === "percentage"
          ? `${coupon.value}%`
          : formatCurrency(coupon.value)}
      </p>
      <p className="text-xs text-slate-400">
        HSD: {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
      </p>
      <button
        onClick={() => {
          if (!user) {
            toast.error("Vui lòng đăng nhập để lưu mã");
            return;
          }
          claimM.mutate(coupon.id);
        }}
        disabled={claimM.isPending}
        className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {claimM.isPending ? "Đang lưu..." : "Lưu"}
      </button>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

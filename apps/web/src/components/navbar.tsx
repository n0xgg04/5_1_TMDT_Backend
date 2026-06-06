"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "./ui/button";
import {
  Hotel,
  LogOut,
  Menu,
  X,
  User,
  CreditCard,
  Ticket,
  ChevronDown,
  Heart,
  Bell,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const customerLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/rooms", label: "Tìm phòng" },
  { href: "/my-bookings", label: "Phòng đã đặt" },
  { href: "/my-coupons", label: "Ưu đãi" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const wishlistQ = useQuery({
    queryKey: ["wishlist-count"],
    queryFn: () => api.get("/wishlist").then((r) => (r.data as any[]).length),
    enabled: !!user,
  });

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff"))
    return null;

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clear();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow">
            <Hotel className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">Sapphire Stay</p>
            <p className="text-xs text-slate-500">Hệ thống đặt phòng</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {customerLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/my-bookings?tab=wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <Heart className="h-4 w-4" />
                {wishlistQ.data ? (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {wishlistQ.data}
                  </span>
                ) : null}
              </Link>
              <NotificationBell accessToken={accessToken} />
              {user.role === "ADMIN" && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              {(user.role === "RECEPTIONIST" ||
                user.role === "HOUSEKEEPING" ||
                user.role === "ADMIN") && (
                <Link href="/staff/room-map">
                  <Button variant="outline" size="sm">
                    Staff
                  </Button>
                </Link>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-3 pl-1 transition-colors hover:bg-slate-200"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                    {user.firstName?.[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/profile?tab=payment"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      Phương thức thanh toán
                    </Link>
                    <Link
                      href="/my-coupons"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Ticket className="h-4 w-4 text-slate-400" />
                      Ưu đãi của tôi
                    </Link>
                    <div className="border-t border-slate-100 mt-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Đăng ký</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page py-3 space-y-1">
            {customerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-2">
              {user ? (
                <>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700">
                    <span>Thông báo</span>
                    <NotificationBell accessToken={accessToken} />
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <User className="h-4 w-4" /> Thông tin cá nhân
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full">Đăng ký</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NotificationBell({ accessToken }: { accessToken: string | null }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.get<Notification[]>("/notifications/me").then((r) => r.data),
    enabled: Boolean(accessToken),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!accessToken || typeof window === "undefined") return;
    const baseURL = api.defaults.baseURL;
    if (!baseURL) return;
    const stream = new EventSource(
      `${baseURL}/notifications/stream?access_token=${encodeURIComponent(accessToken)}`,
    );
    stream.addEventListener("notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });
    stream.onerror = () => {
      stream.close();
    };
    return () => stream.close();
  }, [accessToken, qc]);

  const notifications = q.data ?? [];
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Thông báo</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                Chưa có thông báo
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const data = n.templateData ?? {};
                const title =
                  n.type === "booking.request.approved"
                    ? "Yêu cầu đã được duyệt"
                    : n.type === "booking.request.rejected"
                      ? "Yêu cầu bị từ chối"
                      : n.type.includes("expired")
                        ? "Đơn đã hết hạn"
                        : "Cập nhật đặt phòng";
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.readAt) markRead.mutate(n.id);
                      const bookingId = data.bookingId;
                      if (typeof bookingId === "string") {
                        window.location.href = `/my-bookings/${bookingId}`;
                      }
                    }}
                    className={cn(
                      "block w-full border-b border-slate-100 px-3 py-3 text-left text-sm hover:bg-slate-50",
                      !n.readAt && "bg-amber-50/50",
                    )}
                  >
                    <p className="font-medium text-slate-900">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {typeof data.bookingCode === "string"
                        ? `Đơn ${data.bookingCode}`
                        : n.type}
                    </p>
                    {typeof data.paymentDeadline === "string" && (
                      <p className="mt-1 text-xs text-amber-700">
                        Hạn thanh toán: {formatDateTime(data.paymentDeadline)}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

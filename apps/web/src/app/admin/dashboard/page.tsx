"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Hotel,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationHeader } from "@/components/hotel/commercial";
import { formatCurrency } from "@/lib/utils";

function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfPrevMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1, 1);
  return d.toISOString().slice(0, 10);
}

function lastOfPrevMonth() {
  const d = new Date();
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

const statusLabels: Record<string, string> = {
  PENDING_HOST_APPROVAL: "Chờ duyệt yêu cầu",
  PENDING_PAYMENT: "Chờ thanh toán",
  PAYING: "Đang thanh toán",
  PENDING_APPROVAL: "Chờ duyệt biên lai",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đang lưu trú",
  CHECKED_OUT: "Đã trả phòng",
  CANCELLED: "Đã hủy",
  REJECTED: "Bị từ chối",
  EXPIRED: "Hết hạn",
};

const statusColors = [
  "#7c3aed",
  "#f59e0b",
  "#0ea5e9",
  "#f97316",
  "#10b981",
  "#6366f1",
  "#64748b",
  "#ef4444",
  "#e11d48",
  "#94a3b8",
];

type RevenuePoint = { date: string; revenue: number };
type RevenueResponse = {
  total: number;
  totalRevenue: number;
  totalBookings: number;
  byRoomType: Record<string, { count: number; revenue: number }>;
  data: RevenuePoint[];
};

type OccupancyResponse = {
  totalRooms: number;
  totalRoomNights: number;
  occupiedNights: number;
  occupancyRate: number;
};

type UserStatsResponse = {
  total: number;
  roles: { CUSTOMER: number; RECEPTIONIST: number; HOUSEKEEPING: number; ADMIN: number };
  newThisMonth: number;
};

export default function AdminDashboard() {
  const [from, setFrom] = useState(firstOfPrevMonth());
  const [to, setTo] = useState(lastOfPrevMonth());

  const revenue = useQuery({
    queryKey: ["reports-revenue", from, to],
    queryFn: () =>
      api
        .get<RevenueResponse>("/reports/revenue", {
          params: { from, to, groupBy: "day" },
        })
        .then((r) => r.data),
  });

  const occupancy = useQuery({
    queryKey: ["reports-occupancy", from, to],
    queryFn: () =>
      api
        .get<OccupancyResponse>("/reports/occupancy", { params: { from, to } })
        .then((r) => r.data),
  });

  const summary = useQuery({
    queryKey: ["reports-summary", from, to],
    queryFn: () =>
      api
        .get<Record<string, number>>("/reports/bookings/summary", {
          params: { from, to },
        })
        .then((r) => r.data),
  });

  const userStats = useQuery({
    queryKey: ["reports-users"],
    queryFn: () =>
      api.get<UserStatsResponse>("/reports/users").then((r) => r.data),
  });

  const totalRevenue = Number(revenue.data?.total ?? 0);
  const totalPaidBookings = Number(revenue.data?.totalBookings ?? 0);
  const occRate = Number(occupancy.data?.occupancyRate ?? 0);
  const totalRooms = Number(occupancy.data?.totalRooms ?? 0);
  const occupiedNights = Number(occupancy.data?.occupiedNights ?? 0);
  const totalUsers = Number(userStats.data?.total ?? 0);
  const newUsers = Number(userStats.data?.newThisMonth ?? 0);
  const userRoles = userStats.data?.roles ?? { CUSTOMER: 0, RECEPTIONIST: 0, HOUSEKEEPING: 0, ADMIN: 0 };

  const summaryData = summary.data ?? {};
  const pendingHostApproval = Number(summaryData.PENDING_HOST_APPROVAL ?? 0);
  const pendingPayment = Number(summaryData.PENDING_PAYMENT ?? 0);
  const paying = Number(summaryData.PAYING ?? 0);
  const confirmed = Number(summaryData.CONFIRMED ?? 0);
  const checkedIn = Number(summaryData.CHECKED_IN ?? 0);
  const checkedOut = Number(summaryData.CHECKED_OUT ?? 0);
  const cancelled = Number(summaryData.CANCELLED ?? 0);
  const expiringSoon = Number(summaryData.PENDING_HOST_APPROVAL_EXPIRING_SOON ?? 0);

  const statusChartData = useMemo(
    () =>
      Object.entries(summaryData)
        .filter(([key]) => !key.endsWith("_EXPIRING_SOON"))
        .map(([key, value]) => ({
          key,
          label: statusLabels[key] ?? key,
          count: Number(value),
        }))
        .sort((a, b) => b.count - a.count),
    [summaryData],
  );

  const roomTypeRows = useMemo(
    () =>
      Object.entries(revenue.data?.byRoomType ?? {})
        .map(([name, info]) => ({
          name,
          count: info.count,
          revenue: info.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    [revenue.data?.byRoomType],
  );

  const quickActions = [
    {
      title: "Duyệt yêu cầu đặt chỗ",
      desc: `${pendingHostApproval} booking đang chờ staff xác nhận lịch phòng.`,
      href: "/staff/pending-bookings",
      icon: <Clock3 className="h-5 w-5" />,
      tone: "violet",
    },
    {
      title: "Theo dõi thanh toán",
      desc: `${pendingPayment + paying} booking cần xử lý thanh toán hoặc theo dõi giao dịch.`,
      href: "/staff/receipt-approvals",
      icon: <Wallet className="h-5 w-5" />,
      tone: "amber",
    },
    {
      title: "Lễ tân check-in / out",
      desc: `${confirmed + checkedIn} booking đang ở giai đoạn nhận hoặc trả phòng.`,
      href: "/staff/check-in",
      icon: <Hotel className="h-5 w-5" />,
      tone: "sky",
    },
    {
      title: "Hộp thư hỗ trợ",
      desc: "Theo dõi hội thoại với khách hàng và phản hồi nhanh các yêu cầu phát sinh.",
      href: "/admin/conversations",
      icon: <MessageSquare className="h-5 w-5" />,
      tone: "brand",
    },
  ] as const;

  return (
    <div>
      <OperationHeader
        kicker="Operations"
        title="Dashboard điều hành"
        description="Theo dõi tình hình booking, doanh thu, thanh toán và vận hành lễ tân trong một màn hình tổng hợp dành cho quản trị."
        actions={
          <div className="toolbar-panel grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Từ ngày"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              label="Đến ngày"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Doanh thu thực thu"
          value={formatCurrency(totalRevenue)}
          subtext={`${totalPaidBookings} booking đã thanh toán trong kỳ`}
          tone="brand"
          loading={revenue.isLoading}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Tỷ lệ lấp phòng"
          value={`${occRate.toFixed(1)}%`}
          subtext={`${occupiedNights} đêm đã thuê / ${totalRooms} phòng`}
          tone="emerald"
          loading={occupancy.isLoading}
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Hàng đợi cần xử lý"
          value={String(pendingHostApproval + pendingPayment + paying)}
          subtext={`${pendingHostApproval} duyệt yêu cầu, ${pendingPayment} chờ thanh toán, ${paying} đang thanh toán`}
          tone="violet"
          loading={summary.isLoading}
        />
        <MetricCard
          icon={<Hotel className="h-5 w-5" />}
          label="Vận hành lưu trú"
          value={String(confirmed + checkedIn)}
          subtext={`${confirmed} confirmed, ${checkedIn} đang lưu trú`}
          tone="sky"
          loading={summary.isLoading}
        />
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Người dùng"
          value={String(totalUsers)}
          subtext={`${newUsers} mới tháng này · KH: ${userRoles.CUSTOMER}, NV: ${userRoles.RECEPTIONIST + userRoles.HOUSEKEEPING + userRoles.ADMIN}`}
          tone="indigo"
          loading={userStats.isLoading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tác vụ điều hành nhanh</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((item) => (
              <QuickActionCard key={item.href} {...item} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snapshot trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <StatusRow label="Chờ duyệt yêu cầu" value={pendingHostApproval} tone="violet" />
                <StatusRow label="Sắp hết hạn duyệt" value={expiringSoon} tone="rose" />
                <StatusRow label="Chờ thanh toán" value={pendingPayment} tone="amber" />
                <StatusRow label="Đang thanh toán" value={paying} tone="sky" />
                <StatusRow label="Đã xác nhận" value={confirmed} tone="emerald" />
                <StatusRow label="Đang lưu trú" value={checkedIn} tone="indigo" />
                <StatusRow label="Đã trả phòng" value={checkedOut} tone="slate" />
                <StatusRow label="Đã hủy / hết hạn" value={cancelled + Number(summaryData.EXPIRED ?? 0)} tone="rose" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : revenue.data?.data?.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenue.data.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0070c5"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock text="Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái booking trong kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : statusChartData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={statusChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={entry.key} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyBlock text="Chưa có dữ liệu trạng thái booking trong kỳ này." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Hiệu suất theo loại phòng</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : roomTypeRows.length ? (
              <div className="space-y-3">
                {roomTypeRows.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.count} booking đã thanh toán</p>
                    </div>
                    <p className="text-sm font-bold text-brand-800">{formatCurrency(row.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock text="Chưa có room type nào phát sinh doanh thu trong kỳ." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng kết điều hành</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InsightCard
              icon={<Receipt className="h-5 w-5" />}
              title="Thanh toán"
              value={`${pendingPayment + paying}`}
              detail="Booking đang chờ hoặc đang xử lý thanh toán"
              href="/staff/receipt-approvals"
            />
            <InsightCard
              icon={<CalendarClock className="h-5 w-5" />}
              title="Yêu cầu cần phản hồi"
              value={`${pendingHostApproval}`}
              detail="Booking đang chờ duyệt yêu cầu đặt chỗ"
              href="/staff/pending-bookings"
            />
            <InsightCard
              icon={<BedDouble className="h-5 w-5" />}
              title="Lưu trú đang diễn ra"
              value={`${checkedIn}`}
              detail="Khách đang ở trong ngày hiện tại"
              href="/staff/check-in"
            />
            <InsightCard
              icon={<Users className="h-5 w-5" />}
              title="Chăm sóc khách hàng"
              value="Open"
              detail="Truy cập nhanh hộp thư để xử lý yêu cầu phát sinh"
              href="/admin/conversations"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  tone: "brand" | "emerald" | "sky" | "violet" | "indigo";
  loading?: boolean;
}) {
  const tones = {
    brand: "from-brand-500 to-brand-700",
    emerald: "from-emerald-500 to-emerald-700",
    sky: "from-sky-500 to-sky-700",
    violet: "from-violet-500 to-violet-700",
    indigo: "from-indigo-500 to-indigo-700",
  } as const;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tones[tone]}`}
        >
          {icon}
        </div>
        <LayoutDashboard className="h-4 w-4 text-slate-300" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-full" />
        </>
      ) : (
        <>
          <p className="mt-2 truncate text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{subtext}</p>
        </>
      )}
    </div>
  );
}

function QuickActionCard({
  title,
  desc,
  href,
  icon,
  tone,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  tone: "brand" | "violet" | "amber" | "sky";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
  } as const;

  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">{title}</p>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "rose" | "amber" | "sky" | "emerald" | "indigo" | "slate";
}) {
  const tones = {
    violet: "bg-violet-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    slate: "bg-slate-500",
  } as const;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tones[tone]}`} />
        <span className="truncate text-sm text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  value,
  detail,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-slate-200">
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </Link>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <p className="py-16 text-center text-sm text-slate-500">{text}</p>;
}

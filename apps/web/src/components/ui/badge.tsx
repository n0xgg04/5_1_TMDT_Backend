import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Hourglass,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import type { BookingStatus, RoomStatus } from "@/lib/types";

export type Tone =
  | "slate"
  | "green"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "emerald"
  | "orange"
  | "brand"
  | "gold"
  | "coral"
  | "indigo";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  gold: "bg-gold-50 text-gold-800 ring-gold-200",
  coral: "bg-coral-50 text-coral-700 ring-coral-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const bookingMap: Record<
  BookingStatus,
  { tone: Tone; label: string; action: string; icon: React.ReactNode }
> = {
  PENDING_HOST_APPROVAL: {
    tone: "violet",
    label: "Chờ duyệt yêu cầu",
    action: "Đội ngũ chúng tôi đang kiểm tra và sẽ phản hồi trong 24 giờ.",
    icon: <Hourglass className="h-3.5 w-3.5" />,
  },
  PENDING_PAYMENT: {
    tone: "gold",
    label: "Chờ thanh toán",
    action: "Yêu cầu đã được duyệt. Vui lòng thanh toán trước hạn.",
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  PAYING: {
    tone: "sky",
    label: "Đang thanh toán",
    action: "Hệ thống đang xử lý giao dịch thanh toán.",
    icon: <Banknote className="h-3.5 w-3.5" />,
  },
  PENDING_APPROVAL: {
    tone: "orange",
    label: "Chờ duyệt biên lai",
    action: "Biên lai đã gửi, nhân viên đang xác minh thanh toán.",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  CONFIRMED: {
    tone: "emerald",
    label: "Đã thanh toán",
    action: "Đặt chỗ đã hoàn tất, phòng được giữ cho lịch lưu trú.",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  CHECKED_IN: {
    tone: "indigo",
    label: "Đang lưu trú",
    action: "Khách đã nhận phòng.",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  CHECKED_OUT: {
    tone: "slate",
    label: "Đã trả phòng",
    action: "Kỳ lưu trú đã hoàn tất.",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    tone: "coral",
    label: "Đã hủy",
    action: "Đơn đã bị hủy và phòng đã được giải phóng.",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    tone: "coral",
    label: "Bị từ chối",
    action: "Yêu cầu không được duyệt. Hãy chọn ngày hoặc phòng khác.",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  EXPIRED: {
    tone: "coral",
    label: "Hết hạn",
    action: "Đơn đã quá hạn xử lý hoặc quá hạn thanh toán.",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = bookingMap[status];
  return (
    <Badge tone={s.tone}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

const roomMap: Record<RoomStatus, { tone: Tone; label: string }> = {
  AVAILABLE: { tone: "emerald", label: "Trống" },
  OCCUPIED: { tone: "violet", label: "Đang ở" },
  DIRTY: { tone: "rose", label: "Bẩn" },
  CLEANING: { tone: "amber", label: "Đang dọn" },
  MAINTENANCE: { tone: "slate", label: "Bảo trì" },
  RESERVED: { tone: "sky", label: "Đã đặt" },
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const s = roomMap[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const bookingStatusLabel = (s: BookingStatus) => bookingMap[s].label;
export const roomStatusLabel = (s: RoomStatus) => roomMap[s].label;
export const bookingStatusAction = (s: BookingStatus) => bookingMap[s].action;
export const bookingStatusTone = (s: BookingStatus) => bookingMap[s].tone;

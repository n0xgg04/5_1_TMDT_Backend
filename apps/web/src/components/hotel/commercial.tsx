import Link from "next/link";
import type React from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Maximize2,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, BookingStatusBadge, bookingStatusAction } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

export const HOTEL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
];

export function hotelFallbackImage(seed = "") {
  return HOTEL_FALLBACK_IMAGES[seed.length % HOTEL_FALLBACK_IMAGES.length];
}

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  align = "left",
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {kicker && <span className="commercial-kicker">{kicker}</span>}
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SearchFieldShell({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-16 items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10",
        className,
      )}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
        <span className="mt-1 block">{children}</span>
      </span>
    </label>
  );
}

export function BookingStatePanel({
  status,
  deadline,
  title,
  description,
  action,
}: {
  status: BookingStatus;
  deadline?: string | null;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <BookingStatusBadge status={status} />
          <h3 className="mt-3 text-base font-semibold text-ink-950">
            {title ?? bookingStatusAction(status)}
          </h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
        {deadline && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-right text-xs text-slate-600 ring-1 ring-slate-200">
            <span className="block font-semibold text-slate-900">Deadline</span>
            {deadline}
          </div>
        )}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function RoomCommerceCard({
  href,
  image,
  title,
  subtitle,
  description,
  price,
  priceHint = "/ đêm",
  rating,
  capacity,
  areaSqm,
  bedType,
  nights,
  actionLabel = "Xem phòng",
  onAction,
  className,
}: {
  href?: string;
  image?: string;
  title: string;
  subtitle?: string;
  description?: string | null;
  price?: number | string;
  priceHint?: string;
  rating?: number;
  capacity?: number;
  areaSqm?: number;
  bedType?: string;
  nights?: number;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const imageSrc = image || hotelFallbackImage(title);
  const content = (
    <article
      className={cn(
        "group grid h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift md:grid-cols-[minmax(190px,0.85fr)_1fr]",
        className,
      )}
    >
      <div className="relative min-h-56 overflow-hidden bg-slate-100 md:min-h-full">
        <img
          src={imageSrc}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {rating ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-gold-700 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-current" /> {rating.toFixed(1)}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col p-4">
        <div className="min-w-0">
          {subtitle && (
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{subtitle}</span>
            </p>
          )}
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-ink-950">
            {title}
          </h3>
          {description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          {capacity ? <FeaturePill icon={<Users className="h-3.5 w-3.5" />} label={`${capacity} khách`} /> : null}
          {areaSqm ? <FeaturePill icon={<Maximize2 className="h-3.5 w-3.5" />} label={`${areaSqm} m²`} /> : null}
          {bedType ? <FeaturePill icon={<BedDouble className="h-3.5 w-3.5" />} label={bedType} /> : null}
          {nights ? <FeaturePill icon={<CalendarDays className="h-3.5 w-3.5" />} label={`${nights} đêm`} /> : null}
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Giá từ</p>
            <p className="text-2xl font-bold text-brand-800">
              {price !== undefined ? formatCurrency(price) : "Liên hệ"}
            </p>
            <p className="text-xs text-slate-500">{priceHint}</p>
          </div>
          {onAction ? (
            <Button
              type="button"
              onClick={onAction}
              variant="accent"
              className="w-full sm:w-auto"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : href ? (
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition-colors group-hover:bg-brand-800 sm:w-auto">
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (href && !onAction) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function OperationHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && <p className="operation-kicker">{kicker}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function MetricTile({
  icon,
  label,
  value,
  helper,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  tone?: "brand" | "emerald" | "gold" | "violet" | "coral" | "sky";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-800 ring-brand-100",
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    gold: "bg-gold-50 text-gold-800 ring-gold-100",
    violet: "bg-violet-50 text-violet-800 ring-violet-100",
    coral: "bg-coral-50 text-coral-800 ring-coral-100",
    sky: "bg-sky-50 text-sky-800 ring-sky-100",
  } as const;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1", tones[tone])}>
          {icon}
        </span>
      </div>
    </div>
  );
}

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge tone="emerald">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Còn phòng
      </Badge>
      <Badge tone="gold">Đang giữ</Badge>
      <Badge tone="coral">Đã kín</Badge>
    </div>
  );
}

"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AvailabilityDayStatus,
  RoomTypeAvailabilityDay,
} from "@/lib/types";

type CalendarDay = {
  date: string;
  status: AvailabilityDayStatus | "booked";
  available?: boolean;
  totalRooms?: number;
  availableRooms?: number;
  heldRooms?: number;
  bookedRooms?: number;
};

const statusStyles: Record<string, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  held: "border-amber-200 bg-amber-50 text-amber-800",
  booked: "border-rose-200 bg-rose-50 text-rose-800",
};

const statusLabels: Record<string, string> = {
  available: "Trống",
  held: "Đang giữ",
  booked: "Đã kín",
};

function dayNumber(date: string) {
  return Number(date.split("-")[2]);
}

export function AvailabilityCalendar({
  days,
  selectedFrom,
  selectedTo,
  loading,
}: {
  days: CalendarDay[] | RoomTypeAvailabilityDay[];
  selectedFrom?: string;
  selectedTo?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          Lịch phòng
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-[11px] text-slate-500">
          <LegendDot className="bg-emerald-500" label="Trống" />
          <LegendDot className="bg-amber-500" label="Giữ" />
          <LegendDot className="bg-rose-500" label="Kín" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 14 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : days.length > 0 ? (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const isSelected =
              selectedFrom &&
              selectedTo &&
              day.date >= selectedFrom &&
              day.date < selectedTo;
            const availableRooms =
              "availableRooms" in day ? day.availableRooms : undefined;
            return (
              <div
                key={day.date}
                className={cn(
                  "flex h-16 min-w-0 flex-col justify-between rounded-lg border p-1.5 text-left",
                  statusStyles[day.status] ?? statusStyles.booked,
                  isSelected && "ring-2 ring-brand-500 ring-offset-1",
                )}
              >
                <span className="truncate text-xs font-bold">
                  {dayNumber(day.date)}
                </span>
                <span className="truncate text-[10px] font-medium leading-tight">
                  {availableRooms !== undefined
                    ? `${availableRooms} phòng`
                    : statusLabels[day.status]}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          Chưa có dữ liệu lịch cho khoảng ngày này.
        </div>
      )}
    </div>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}

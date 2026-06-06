"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, RefreshCw, Search } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { bookingStatusLabel } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type {
  BookingStatus,
  RoomType,
  StaffBookingCalendarResponse,
  StaffCalendarBookingBlock,
} from "@/lib/types";

const statusStyle: Record<BookingStatus, string> = {
  PENDING_HOST_APPROVAL: "border-violet-200 bg-violet-50 text-violet-800",
  PENDING_PAYMENT: "border-amber-200 bg-amber-50 text-amber-800",
  PAYING: "border-sky-200 bg-sky-50 text-sky-800",
  PENDING_APPROVAL: "border-orange-200 bg-orange-50 text-orange-800",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CHECKED_IN: "border-indigo-200 bg-indigo-50 text-indigo-800",
  CHECKED_OUT: "border-slate-200 bg-slate-50 text-slate-600",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  EXPIRED: "border-rose-200 bg-rose-50 text-rose-700",
};

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDaysISO(date: string, days: number) {
  const next = parseISODate(date);
  next.setDate(next.getDate() + days);
  return toISODate(next);
}

function todayISO() {
  return toISODate(new Date());
}

function bookingCoversDate(booking: StaffCalendarBookingBlock, date: string) {
  return booking.checkIn <= date && booking.checkOut > date;
}

export default function StaffBookingCalendarPage() {
  const router = useRouter();
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(addDaysISO(todayISO(), 13));
  const [roomTypeId, setRoomTypeId] = useState("");
  const [floor, setFloor] = useState("");

  useEffect(() => {
    if (to < from) setTo(from);
  }, [from, to]);

  const calendarQ = useQuery({
    queryKey: ["staff-booking-calendar", from, to, roomTypeId, floor],
    queryFn: () =>
      api
        .get<StaffBookingCalendarResponse>("/staff/booking-calendar", {
          params: {
            from,
            to,
            ...(roomTypeId ? { roomTypeId } : {}),
            ...(floor ? { floor } : {}),
          },
        })
        .then((r) => r.data),
  });

  const roomTypesQ = useQuery({
    queryKey: ["staff-room-types"],
    queryFn: () => api.get<RoomType[]>("/rooms/types").then((r) => r.data),
  });

  const floors = useMemo(() => {
    const values = new Set<number>();
    calendarQ.data?.rooms.forEach((room) => values.add(room.floor));
    return Array.from(values).sort((a, b) => a - b);
  }, [calendarQ.data?.rooms]);

  const days = calendarQ.data?.days ?? [];
  const rooms = calendarQ.data?.rooms ?? [];

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lịch đặt phòng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem phòng đang trống, đang giữ và đã xác nhận theo từng ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium text-slate-700">
            Từ ngày
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Đến ngày
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
          <Select
            label="Loại phòng"
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
          >
            <option value="">Tất cả</option>
            {roomTypesQ.data?.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {roomType.name}
              </option>
            ))}
          </Select>
          <Select
            label="Tầng"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          >
            <option value="">Tất cả</option>
            {floors.map((value) => (
              <option key={value} value={value}>
                Tầng {value}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            className="self-end"
            onClick={() => calendarQ.refetch()}
          >
            <RefreshCw className="h-4 w-4" /> Tải lại
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs">
        {(
          [
            "PENDING_HOST_APPROVAL",
            "PENDING_PAYMENT",
            "PAYING",
            "PENDING_APPROVAL",
            "CONFIRMED",
            "CHECKED_IN",
          ] as BookingStatus[]
        ).map((status) => (
          <span
            key={status}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 font-medium",
              statusStyle[status],
            )}
          >
            {bookingStatusLabel(status)}
          </span>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          {calendarQ.isLoading ? (
            <div className="p-5">
              <Skeleton className="h-80 w-full" />
            </div>
          ) : calendarQ.isError ? (
            <div className="p-5">
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="Không tải được lịch"
                description={getApiErrorMessage(calendarQ.error)}
              />
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" />}
                title="Không có phòng"
                description="Không có phòng phù hợp với bộ lọc hiện tại."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[980px]"
                style={{
                  gridTemplateColumns: `180px repeat(${days.length}, minmax(110px, 1fr))`,
                }}
              >
                <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 p-3 text-xs font-semibold uppercase text-slate-500">
                  Phòng
                </div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r border-slate-200 bg-slate-50 p-3 text-center"
                  >
                    <p className="text-xs font-bold text-slate-900">
                      {parseISODate(day).toLocaleDateString("vi-VN", {
                        weekday: "short",
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(day)}
                    </p>
                  </div>
                ))}

                {rooms.map((room) => (
                  <div key={room.id} className="contents">
                    <div className="sticky left-0 z-10 min-w-0 border-b border-r border-slate-200 bg-white p-3">
                      <p className="truncate text-sm font-bold text-slate-900">
                        Phòng {room.roomNumber}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Tầng {room.floor} · {room.roomType.name}
                      </p>
                    </div>
                    {days.map((day) => {
                      const bookings = room.bookings.filter((booking) =>
                        bookingCoversDate(booking, day),
                      );
                      return (
                        <div
                          key={`${room.id}-${day}`}
                          className="min-h-[76px] border-b border-r border-slate-200 bg-white p-1.5"
                        >
                          {bookings.length === 0 ? (
                            <div className="flex h-full min-h-[64px] items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-medium text-emerald-700">
                              Trống
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {bookings.map((booking) => (
                                <button
                                  key={booking.id}
                                  onClick={() => router.push(booking.action.href)}
                                  className={cn(
                                    "block w-full min-w-0 rounded-lg border px-2 py-1.5 text-left transition hover:shadow-sm",
                                    statusStyle[booking.status],
                                  )}
                                >
                                  <span className="block truncate text-xs font-bold">
                                    #{booking.bookingCode}
                                  </span>
                                  <span className="block truncate text-[11px]">
                                    {booking.customer.firstName}{" "}
                                    {booking.customer.lastName}
                                  </span>
                                  <span className="block truncate text-[10px] opacity-80">
                                    {bookingStatusLabel(booking.status)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

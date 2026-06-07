"use client";

import { AlertTriangle, CalendarDays, Search, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { AvailabilityConflict } from "@/lib/types";

export interface BookingConflictDialogData {
  title?: string;
  message?: string;
  selectedFrom: string;
  selectedTo: string;
  conflicts?: AvailabilityConflict[];
  findOtherHref?: string;
}

export function BookingConflictDialog({
  open,
  data,
  onClose,
  onChooseDates,
  onFindOther,
}: {
  open: boolean;
  data: BookingConflictDialogData | null;
  onClose: () => void;
  onChooseDates: () => void;
  onFindOther?: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={data?.title ?? "Khoảng ngày này chưa thể đặt"}
      description={
        data?.message ??
        "Một hoặc nhiều ngày trong khoảng bạn chọn đã có người đặt hoặc đang được giữ."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onChooseDates}>
            <CalendarDays className="h-4 w-4" /> Chọn lại ngày
          </Button>
          {data?.findOtherHref && onFindOther && (
            <Button onClick={onFindOther}>
              <Search className="h-4 w-4" /> Tìm phòng khác
            </Button>
          )}
        </>
      }
    >
      {data && (
        <div className="space-y-4">
          <div className="grid gap-4 rounded-lg border border-coral-200 bg-coral-50 p-5 sm:grid-cols-[auto_1fr]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-coral-700 shadow-sm ring-1 ring-coral-200">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral-700">
                Không thể giữ phòng cho khoảng ngày này
              </p>
              <p className="mt-2 text-lg font-bold text-coral-950">
                {formatDate(data.selectedFrom)} -{" "}
                {formatDate(data.selectedTo)}
              </p>
              <p className="mt-2 text-sm leading-6 text-coral-800">
                Vui lòng chọn khoảng ngày khác hoặc tìm phòng khác còn trống.
              </p>
            </div>
          </div>

          {data.conflicts && data.conflicts.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-coral-600" />
                Khoảng bị trùng
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.conflicts.map((conflict, index) => (
                  <div
                    key={`${conflict.checkIn}-${conflict.checkOut}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {formatDate(conflict.checkIn)} -{" "}
                      {formatDate(conflict.checkOut)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {conflict.status === "held" ? "Đang giữ" : "Đã kín"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

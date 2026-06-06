"use client";

import { AlertTriangle, CalendarDays, Search } from "lucide-react";
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
      size="lg"
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
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-amber-950">
                Ngày đã chọn: {formatDate(data.selectedFrom)} -{" "}
                {formatDate(data.selectedTo)}
              </p>
              <p className="mt-1 text-amber-800">
                Vui lòng chọn khoảng ngày khác hoặc tìm phòng khác còn trống.
              </p>
            </div>
          </div>

          {data.conflicts && data.conflicts.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Khoảng bị trùng
              </p>
              <div className="space-y-2">
                {data.conflicts.map((conflict, index) => (
                  <div
                    key={`${conflict.checkIn}-${conflict.checkOut}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {formatDate(conflict.checkIn)} -{" "}
                      {formatDate(conflict.checkOut)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
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

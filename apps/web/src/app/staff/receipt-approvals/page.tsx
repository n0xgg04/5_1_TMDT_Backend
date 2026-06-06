"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Receipt,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookingStatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default function StaffReceiptApprovalsPage() {
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>(
    {},
  );

  const { data, isLoading } = useQuery({
    queryKey: ["staff-receipt-approvals"],
    queryFn: () =>
      api
        .get<{ items?: Booking[]; data?: Booking[]; total: number }>(
          "/bookings/staff/pending",
        )
        .then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Đã duyệt biên lai");
      qc.invalidateQueries({ queryKey: ["staff-receipt-approvals"] });
    },
    onError: (e) => toast.error("Duyệt thất bại", getApiErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối biên lai");
      qc.invalidateQueries({ queryKey: ["staff-receipt-approvals"] });
    },
    onError: (e) => toast.error("Từ chối thất bại", getApiErrorMessage(e)),
  });

  const items = data?.items ?? data?.data ?? [];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Duyệt biên lai</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xác nhận biên lai chuyển khoản sau khi khách đã được duyệt đặt chỗ.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Không có biên lai nào chờ duyệt
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      #{b.bookingCode}
                    </span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="flex gap-2">
                    {!showRejectInput[b.id] && (
                      <Button
                        size="sm"
                        onClick={() => approve.mutate(b.id)}
                        loading={approve.isPending && approve.variables === b.id}
                      >
                        <CheckCircle className="h-4 w-4" /> Duyệt biên lai
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        showRejectInput[b.id]
                          ? reject.mutate({
                              id: b.id,
                              reason: rejectReason[b.id]?.trim() || "Biên lai không hợp lệ",
                            })
                          : setShowRejectInput((p) => ({ ...p, [b.id]: true }))
                      }
                      loading={reject.isPending && reject.variables?.id === b.id}
                    >
                      <XCircle className="h-4 w-4" />{" "}
                      {showRejectInput[b.id] ? "Xác nhận từ chối" : "Từ chối"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Khách"
                    value={`${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Lưu trú"
                    value={`${formatDate(b.checkIn)} → ${formatDate(b.checkOut)}`}
                  />
                  <InfoRow
                    icon={<Receipt className="h-4 w-4" />}
                    label="Số tiền"
                    value={formatCurrency(b.totalAmount)}
                  />
                </div>

                {b.attachments?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {b.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-slate-200"
                      >
                        Xem biên lai
                      </a>
                    ))}
                  </div>
                ) : null}

                {showRejectInput[b.id] && (
                  <Input
                    placeholder="Lý do từ chối"
                    value={rejectReason[b.id] ?? ""}
                    onChange={(e) =>
                      setRejectReason((p) => ({ ...p, [b.id]: e.target.value }))
                    }
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span className="text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

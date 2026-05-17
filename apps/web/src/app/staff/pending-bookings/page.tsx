"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Calendar,
  User as UserIcon,
  BedDouble,
  CreditCard,
  Receipt,
  Clock,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default function StaffPendingBookingsPage() {
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<
    Record<string, boolean>
  >({});

  const { data, isLoading } = useQuery({
    queryKey: ["staff-pending-bookings"],
    queryFn: () =>
      api
        .get<{ items: Booking[]; total: number }>("/bookings/staff/pending")
        .then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Đã duyệt booking");
      qc.invalidateQueries({ queryKey: ["staff-pending-bookings"] });
    },
    onError: (e) => toast.error("Duyệt thất bại", getApiErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối booking");
      qc.invalidateQueries({ queryKey: ["staff-pending-bookings"] });
    },
    onError: (e) => toast.error("Từ chối thất bại", getApiErrorMessage(e)),
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Duyệt đặt phòng</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem xét và phê duyệt các đơn đặt phòng từ khách hàng
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              Không có đơn nào chờ duyệt
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {data.items.map((b) => (
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
                        loading={
                          approve.isPending && approve.variables === b.id
                        }
                      >
                        <CheckCircle className="h-4 w-4" /> Duyệt
                      </Button>
                    )}
                    {!showRejectInput[b.id] ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setShowRejectInput((p) => ({ ...p, [b.id]: true }))
                        }
                      >
                        <XCircle className="h-4 w-4" /> Từ chối
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const reason = rejectReason[b.id]?.trim();
                          if (!reason) {
                            toast.warning("Vui lòng nhập lý do từ chối");
                            return;
                          }
                          reject.mutate({ id: b.id, reason });
                        }}
                        loading={
                          reject.isPending && reject.variables?.id === b.id
                        }
                      >
                        <XCircle className="h-4 w-4" /> Xác nhận từ chối
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Khách"
                    value={`${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`}
                  />
                  <InfoRow
                    icon={<BedDouble className="h-4 w-4" />}
                    label="Phòng"
                    value={`#${b.room?.roomNumber ?? ""} - ${b.room?.roomType?.name ?? ""}`}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Nhận phòng"
                    value={`${formatDate(b.checkIn)} ${b.checkInTime ? `(${b.checkInTime})` : ""}`}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Trả phòng"
                    value={`${formatDate(b.checkOut)} ${b.checkOutTime ? `(${b.checkOutTime})` : ""}`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Ngườ i lớn"
                    value={`${b.adults ?? 2}`}
                  />
                  <InfoRow
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Trẻ em"
                    value={`${b.children ?? 0}`}
                  />
                  <InfoRow
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Thanh toán"
                    value={`${b.payment?.method ?? "-"} (${b.payment?.paymentType ?? "FULL"})`}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">Tổng tiền</p>
                    <p className="text-xl font-bold text-brand-700">
                      {formatCurrency(b.totalAmount)}
                    </p>
                    {b.payment && b.payment.amount !== b.totalAmount && (
                      <p className="text-xs text-slate-500">
                        Đã thanh toán: {formatCurrency(b.payment.amount)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Trạng thái thanh toán
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {b.payment?.status ?? "Chưa thanh toán"}
                    </p>
                  </div>
                </div>

                {b.specialRequests && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="flex items-center gap-1 font-medium text-amber-800">
                      <MessageSquare className="h-3.5 w-3.5" /> Yêu cầu đặc biệt
                    </p>
                    <p className="mt-1 text-amber-700">{b.specialRequests}</p>
                  </div>
                )}

                {b.guestNotes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-700">Ghi chú:</p>
                    <p className="mt-1 text-slate-600">{b.guestNotes}</p>
                  </div>
                )}

                {b.attachments && b.attachments.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Receipt className="h-3.5 w-3.5" /> Biên lai chuyển khoản
                    </p>
                    <div className="mt-2 flex gap-2">
                      {b.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-slate-200 hover:bg-slate-100"
                        >
                          <ImageIcon className="h-3 w-3" /> Xem ảnh
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {showRejectInput[b.id] && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Nhập lý do từ chối..."
                      value={rejectReason[b.id] ?? ""}
                      onChange={(e) =>
                        setRejectReason((p) => ({
                          ...p,
                          [b.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowRejectInput((p) => ({ ...p, [b.id]: false }));
                        setRejectReason((p) => ({ ...p, [b.id]: "" }));
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
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
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

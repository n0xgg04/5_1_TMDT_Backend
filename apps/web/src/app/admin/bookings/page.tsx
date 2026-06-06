"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  DoorOpen,
  DoorClosed,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: string; label: string; tone: string }[] = [
  { value: "", label: "Tất cả", tone: "slate" },
  {
    value: "PENDING_HOST_APPROVAL",
    label: "Chờ duyệt yêu cầu",
    tone: "violet",
  },
  { value: "PENDING_PAYMENT", label: "Chờ thanh toán", tone: "amber" },
  { value: "PAYING", label: "Đang thanh toán", tone: "sky" },
  { value: "PENDING_APPROVAL", label: "Chờ duyệt biên lai", tone: "amber" },
  { value: "CONFIRMED", label: "Đã xác nhận", tone: "emerald" },
  { value: "CHECKED_IN", label: "Đang ở", tone: "sky" },
  { value: "CHECKED_OUT", label: "Đã trả phòng", tone: "slate" },
  { value: "CANCELLED", label: "Đã hủy", tone: "rose" },
  { value: "REJECTED", label: "Bị từ chối", tone: "rose" },
  { value: "EXPIRED", label: "Hết hạn", tone: "rose" },
];

function statusBadgeTone(status: BookingStatus): any {
  const map: Record<string, string> = {
    PENDING_HOST_APPROVAL: "violet",
    PENDING_PAYMENT: "amber",
    PAYING: "sky",
    PENDING_APPROVAL: "amber",
    CONFIRMED: "emerald",
    CHECKED_IN: "sky",
    CHECKED_OUT: "slate",
    CANCELLED: "rose",
    REJECTED: "rose",
    EXPIRED: "rose",
  };
  return map[status] ?? "slate";
}

function statusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    PENDING_HOST_APPROVAL: "Chờ duyệt yêu cầu",
    PENDING_PAYMENT: "Chờ thanh toán",
    PAYING: "Đang thanh toán",
    PENDING_APPROVAL: "Chờ duyệt biên lai",
    CONFIRMED: "Đã xác nhận",
    CHECKED_IN: "Đang ở",
    CHECKED_OUT: "Đã trả phòng",
    CANCELLED: "Đã hủy",
    REJECTED: "Bị từ chối",
    EXPIRED: "Hết hạn",
  };
  return map[status] ?? status;
}

interface BookingDetailModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string, reason: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onCheckin: (id: string) => void;
  onCheckout: (id: string) => void;
}

function BookingDetailModal({
  booking,
  open,
  onClose,
  onApproveRequest,
  onRejectRequest,
  onApprove,
  onReject,
  onCheckin,
  onCheckout,
}: BookingDetailModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!booking) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Đơn #${booking.bookingCode}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Khách hàng</p>
            <p className="mt-1 font-medium text-slate-900">
              {booking.customer?.firstName} {booking.customer?.lastName}
            </p>
            <p className="text-sm text-slate-600">{booking.customer?.email}</p>
            <p className="text-sm text-slate-600">{booking.customer?.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Phòng</p>
            <p className="mt-1 font-medium text-slate-900">
              {booking.room?.roomNumber} — {booking.room?.roomType?.name}
            </p>
            <p className="text-sm text-slate-600">Tầng {booking.room?.floor}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Thời gian</p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
            </p>
            <p className="text-xs text-slate-500">
              Check-in: {booking.checkInTime ?? "14:00"} | Check-out:{" "}
              {booking.checkOutTime ?? "12:00"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Tổng tiền</p>
            <p className="mt-1 text-lg font-bold text-brand-700">
              {formatCurrency(Number(booking.totalAmount))}
            </p>
            <Badge tone={statusBadgeTone(booking.status)}>
              {statusLabel(booking.status)}
            </Badge>
          </div>
        </div>

        {booking.specialRequests && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Yêu cầu đặc biệt</p>
            <p className="mt-1 text-sm text-slate-700">{booking.specialRequests}</p>
          </div>
        )}

        {booking.payment && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Thanh toán</p>
            <p className="mt-1 text-sm text-slate-700">
              Phương thức: {booking.payment.method} | Trạng thái: {booking.payment.status}
            </p>
            {booking.payment.receiptImageUrl && (
              <a
                href={booking.payment.receiptImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-600 underline"
              >
                Xem biên lai
              </a>
            )}
          </div>
        )}

        {booking.rejectedReason && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Lý do từ chối</p>
            <p className="mt-1 text-sm text-rose-600">{booking.rejectedReason}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-4">
          {booking.status === "PENDING_HOST_APPROVAL" && (
            <>
              <Button onClick={() => onApproveRequest(booking.id)}>
                <CheckCircle className="h-4 w-4" /> Duyệt yêu cầu
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="h-4 w-4" /> Từ chối yêu cầu
              </Button>
            </>
          )}
          {booking.status === "PENDING_APPROVAL" && (
            <>
              <Button onClick={() => onApprove(booking.id)}>
                <CheckCircle className="h-4 w-4" /> Duyệt biên lai
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="h-4 w-4" /> Từ chối biên lai
              </Button>
            </>
          )}
          {booking.status === "CONFIRMED" && (
            <Button onClick={() => onCheckin(booking.id)}>
              <DoorOpen className="h-4 w-4" /> Check-in
            </Button>
          )}
          {booking.status === "CHECKED_IN" && (
            <Button onClick={() => onCheckout(booking.id)}>
              <DoorClosed className="h-4 w-4" /> Check-out
            </Button>
          )}
        </div>

        {showRejectForm && (
          <div className="space-y-3 rounded-lg border p-4">
            <Input
              label="Lý do từ chối"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do..."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  if (booking.status === "PENDING_HOST_APPROVAL") {
                    onRejectRequest(booking.id, rejectReason);
                  } else {
                    onReject(booking.id, rejectReason);
                  }
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                disabled={!rejectReason}
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const list = useQuery({
    queryKey: ["admin-bookings", page, status, search, from, to],
    queryFn: () =>
      api
        .get("/bookings", {
          params: {
            page,
            limit: 20,
            ...(status ? { status } : {}),
            ...(search ? { search } : {}),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
          },
        })
        .then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/approve`),
    onSuccess: () => {
      toast.success("Đã duyệt booking");
      setDetailOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const approveRequest = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/approve-request`),
    onSuccess: () => {
      toast.success("Đã duyệt yêu cầu đặt phòng");
      setDetailOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối booking");
      setDetailOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const rejectRequest = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/reject-request`, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối yêu cầu đặt phòng");
      setDetailOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const checkin = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/checkin`),
    onSuccess: () => {
      toast.success("Check-in thành công");
      setDetailOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const checkout = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/checkout`),
    onSuccess: () => {
      toast.success("Check-out thành công");
      setDetailOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const openDetail = (b: Booking) => {
    setSelectedBooking(b);
    setDetailOpen(true);
  };

  const data = list.data as any;
  const items: Booking[] = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Đặt phòng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý tất cả đơn đặt phòng
          </p>
        </div>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-60">
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Input
              label="Từ ngày"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Input
              label="Đến ngày"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Tìm kiếm"
              placeholder="Mã đơn, tên, email, SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Mã đơn</Th>
                <Th>Khách hàng</Th>
                <Th>Phòng</Th>
                <Th>Nhận/Trả</Th>
                <Th>Tổng tiền</Th>
                <Th>Trạng thái</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {list.isLoading && (
                <tr>
                  <td colSpan={7} className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              )}
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <Td className="font-mono text-xs font-semibold">
                    {b.bookingCode?.slice(0, 8)}...
                  </Td>
                  <Td>
                    <p className="font-medium text-slate-900">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{b.customer?.email}</p>
                  </Td>
                  <Td>
                    <p className="text-slate-900">{b.room?.roomNumber}</p>
                    <p className="text-xs text-slate-500">
                      {b.room?.roomType?.name}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-xs text-slate-700">
                      {formatDate(b.checkIn)}
                    </p>
                    <p className="text-xs text-slate-500">→</p>
                    <p className="text-xs text-slate-700">
                      {formatDate(b.checkOut)}
                    </p>
                  </Td>
                  <Td className="font-semibold text-brand-700">
                    {formatCurrency(Number(b.totalAmount))}
                  </Td>
                  <Td>
                    <Badge tone={statusBadgeTone(b.status)}>
                      {statusLabel(b.status)}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetail(b)}>
                      <Eye className="h-3.5 w-3.5" /> Chi tiết
                    </Button>
                  </Td>
                </tr>
              ))}
              {!list.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                    Không có đơn đặt phòng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-slate-500">
              Tổng: {total} đơn (trang {page}/{totalPages})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      <BookingDetailModal
        booking={selectedBooking}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedBooking(null);
        }}
        onApproveRequest={(id) => approveRequest.mutate(id)}
        onRejectRequest={(id, reason) =>
          rejectRequest.mutate({ id, reason })
        }
        onApprove={(id) => approve.mutate(id)}
        onReject={(id, reason) => reject.mutate({ id, reason })}
        onCheckin={(id) => checkin.mutate(id)}
        onCheckout={(id) => checkout.mutate(id)}
      />
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

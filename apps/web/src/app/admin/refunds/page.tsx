"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  Building2,
  User,
  Receipt,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationHeader } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RefundRow {
  id: string;
  bookingId: string;
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  bankBranch?: string | null;
  refundAmount: string | number;
  refundPercent: number;
  status: string;
  createdAt: string;
  processedAt?: string | null;
  booking: {
    bookingCode: string;
    checkIn: string;
    checkOut: string;
    room?: { roomNumber: string; roomType?: { name: string } };
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
}

export default function AdminRefundsPage() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: () =>
      api
        .get<{ items: RefundRow[]; total: number }>("/bookings/refunds")
        .then((r) => r.data),
  });

  const processRefund = useMutation({
    mutationFn: (id: string) =>
      api.post(`/bookings/refunds/${id}/process`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã đánh dấu hoàn tiền thành công");
      qc.invalidateQueries({ queryKey: ["admin-refunds"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const items = list.data?.items ?? [];

  return (
    <div>
      <OperationHeader
        kicker="Finance"
        title="Quản lý hoàn tiền"
        description="Duyệt và xác nhận các yêu cầu hoàn tiền từ khách hàng đã hủy đơn."
      />

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Khách hàng</Th>
                <Th>Đơn</Th>
                <Th>Ngân hàng</Th>
                <Th>Số tiền hoàn</Th>
                <Th>Tỷ lệ</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày gửi</Th>
                <Th className="text-right">Xử lý</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {list.isLoading && (
                <tr>
                  <td colSpan={8} className="p-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              )}
              {!list.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-slate-500">
                    Chưa có yêu cầu hoàn tiền nào
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <Td>
                    <p className="font-medium text-slate-900">
                      {item.customer.firstName} {item.customer.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{item.customer.email}</p>
                  </Td>
                  <Td>
                    <p className="font-mono text-xs text-slate-700">
                      {item.booking.bookingCode}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.booking.room?.roomType?.name ?? "Phòng"} #{item.booking.room?.roomNumber ?? "-"}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-800">{item.bankName}</p>
                        <p className="text-xs text-slate-500">
                          {item.accountHolder} · {item.accountNumber}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-semibold text-brand-700">
                    {formatCurrency(Number(item.refundAmount))}
                  </Td>
                  <Td>
                    <Badge tone="sky">{item.refundPercent}%</Badge>
                  </Td>
                  <Td>
                    {item.status === "completed" ? (
                      <Badge tone="emerald">Đã hoàn</Badge>
                    ) : (
                      <Badge tone="amber">Chờ xử lý</Badge>
                    )}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {formatDate(item.createdAt)}
                  </Td>
                  <Td className="text-right">
                    {item.status === "pending" && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          if (confirm("Xác nhận đã chuyển khoản hoàn tiền?")) {
                            processRefund.mutate(item.id);
                          }
                        }}
                        loading={processRefund.isPending}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Đã hoàn
                      </Button>
                    )}
                    {item.status === "completed" && (
                      <span className="text-xs text-slate-400">
                        {item.processedAt ? formatDate(item.processedAt) : ""}
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-5">
          <h3 className="text-base font-bold text-slate-900">Chính sách hoàn tiền</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-4">
            <div className="rounded-lg border bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">100%</p>
              <p className="text-xs text-slate-500">Trên 7 ngày trước check-in</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-sky-600">70%</p>
              <p className="text-xs text-slate-500">3 - 7 ngày trước check-in</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">50%</p>
              <p className="text-xs text-slate-500">1 - 3 ngày trước check-in</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-rose-600">30%</p>
              <p className="text-xs text-slate-500">Dưới 1 ngày trước check-in</p>
            </div>
          </div>
        </CardContent>
      </Card>
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

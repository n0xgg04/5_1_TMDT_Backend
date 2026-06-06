"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
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
import type { Coupon } from "@/lib/types";

const schema = z.object({
  code: z.string().min(1, "Bắt buộc").max(50).transform((v) => v.toUpperCase()),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(1, "Giá trị phải lớn hơn 0"),
  minAmount: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().int().min(1).default(1),
  startDate: z.string().min(1, "Bắt buộc"),
  endDate: z.string().min(1, "Bắt buộc"),
});
type FormValues = z.infer<typeof schema>;

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get("/coupons/admin").then((r) => r.data),
  });

  const items: Coupon[] = Array.isArray(list.data) ? list.data : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "percentage", usageLimit: 1 },
  });

  const create = useMutation({
    mutationFn: (data: FormValues) => api.post("/coupons/admin", data),
    onSuccess: () => {
      toast.success("Tạo coupon thành công");
      setOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const disable = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/coupons/admin/${id}`, { isActive: false }),
    onSuccess: () => {
      toast.success("Đã vô hiệu hóa coupon");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Khuyến mãi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý mã giảm giá và chương trình khuyến mãi
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Tạo coupon
        </Button>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Mã</Th>
                <Th>Loại</Th>
                <Th>Giá trị</Th>
                <Th>SL đã dùng</Th>
                <Th>Hiệu lực</Th>
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
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <Td className="font-mono font-bold text-slate-900">{c.code}</Td>
                  <Td>
                    <Badge tone={c.type === "percentage" ? "blue" : "amber"}>
                      {c.type === "percentage" ? "% Giảm" : "VNĐ"}
                    </Badge>
                  </Td>
                  <Td>
                    {c.type === "percentage"
                      ? `${c.value}%`
                      : formatCurrency(Number(c.value))}
                  </Td>
                  <Td>
                    {c.usageCount}/{c.usageLimit}
                  </Td>
                  <Td>
                    <p className="text-xs text-slate-600">
                      {formatDate(c.startDate)}
                    </p>
                    <p className="text-xs text-slate-500">→</p>
                    <p className="text-xs text-slate-600">
                      {formatDate(c.endDate)}
                    </p>
                  </Td>
                  <Td>
                    {c.isActive ? (
                      <Badge tone="emerald">Hoạt động</Badge>
                    ) : (
                      <Badge tone="rose">Đã tắt</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    {c.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disable.mutate(c.id)}
                      >
                        <ToggleRight className="h-3.5 w-3.5" /> Vô hiệu hóa
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
              {!list.isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                    Chưa có coupon nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => { setOpen(false); form.reset(); }}
        title="Tạo coupon mới"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); form.reset(); }}>
              Hủy
            </Button>
            <Button
              onClick={form.handleSubmit((d) => create.mutate(d))}
              loading={create.isPending}
            >
              Tạo
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Mã coupon"
            placeholder="SUMMER2026"
            {...form.register("code")}
            error={form.formState.errors.code?.message}
          />
          <Select label="Loại giảm giá" {...form.register("type")}>
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định</option>
          </Select>
          <Input
            label="Giá trị"
            type="number"
            min={1}
            {...form.register("value")}
            error={form.formState.errors.value?.message}
          />
          <Input
            label="Giới hạn sử dụng"
            type="number"
            min={1}
            {...form.register("usageLimit")}
          />
          <Input
            label="Đơn tối thiểu (VND)"
            type="number"
            min={0}
            {...form.register("minAmount")}
          />
          <Input
            label="Giảm tối đa (VND)"
            type="number"
            min={0}
            {...form.register("maxDiscount")}
          />
          <Input
            label="Ngày bắt đầu"
            type="date"
            {...form.register("startDate")}
            error={form.formState.errors.startDate?.message}
          />
          <Input
            label="Ngày kết thúc"
            type="date"
            {...form.register("endDate")}
            error={form.formState.errors.endDate?.message}
          />
        </div>
      </Modal>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>{children}</td>
  );
}

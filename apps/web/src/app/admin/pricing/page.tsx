"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OperationHeader } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";
import type { RoomType } from "@/lib/types";

interface PricingRule {
  id: string;
  roomTypeId: string;
  type: "DEFAULT" | "SEASONAL" | "HOLIDAY";
  pricePerNight: string | number;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const pricingTypeTone = (t: string) =>
  t === "HOLIDAY" ? "rose" : t === "SEASONAL" ? "amber" : "slate";

const pricingTypeLabel = (t: string) =>
  t === "HOLIDAY" ? "Ngày lễ" : t === "SEASONAL" ? "Theo mùa" : "Mặc định";

const schema = z.object({
  roomTypeId: z.string().min(1, "Chọn loại phòng"),
  type: z.enum(["DEFAULT", "SEASONAL", "HOLIDAY"]),
  pricePerNight: z.coerce.number().min(1, "Giá phải lớn hơn 0"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.coerce.number().int(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminPricingPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");

  const roomTypes = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () =>
      api.get("/rooms/types", { params: { includeInactive: true } }).then((r) => r.data),
  });

  const rtList: RoomType[] = Array.isArray(roomTypes.data)
    ? roomTypes.data
    : Array.isArray((roomTypes.data as any)?.data)
      ? (roomTypes.data as any).data
      : [];

  const rulesQuery = useQuery({
    queryKey: ["pricing-rules", selectedType],
    queryFn: async () => {
      if (!selectedType) {
        // Get all types with pricing rules embedded
        const types = await api.get("/rooms/types", { params: { includeInactive: true } });
        return types.data;
      }
      const detail = await api.get(`/rooms/types/${selectedType}`);
      return [detail.data];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "DEFAULT", priority: 0 },
  });

  const create = useMutation({
    mutationFn: (data: FormValues) => api.post("/rooms/pricing", data),
    onSuccess: () => {
      toast.success("Tạo quy tắc giá thành công");
      setOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      qc.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/pricing/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa quy tắc giá");
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      qc.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  // Extract pricing rules from room type data
  const extractRules = (): { roomType: RoomType; rules: PricingRule[] }[] => {
    if (selectedType) {
      const detail = rulesQuery.data;
      if (!detail) return [];
      const rt = Array.isArray(detail) ? detail[0] : detail;
      return [
        {
          roomType: rt as any,
          rules: ((rt as any)?.pricingRules ?? []) as PricingRule[],
        },
      ];
    }
    return rtList.map((rt) => ({
      roomType: rt,
      rules: ((rt as any)?.pricingRules ?? []) as PricingRule[],
    }));
  };

  const grouped = extractRules();

  return (
    <div>
      <OperationHeader
        kicker="Pricing"
        title="Cấu hình giá"
        description="Thiết lập giá mặc định, theo mùa và ngày lễ để search/booking hiển thị giá đúng theo lịch lưu trú."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Thêm quy tắc giá
          </Button>
        }
      />

      <div className="toolbar-panel mt-4 w-full sm:w-72">
        <Select
          label="Lọc theo loại phòng"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">Tất cả loại phòng</option>
          {rtList.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </Select>
      </div>

      {grouped.map(({ roomType, rules }) => (
        <Card key={roomType.id} className="mt-4 overflow-hidden">
          <div className="border-b bg-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">{roomType.name}</h3>
          </div>
          {rules.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Chưa có quy tắc giá cho loại phòng này
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Loại giá</Th>
                    <Th>Giá/đêm</Th>
                    <Th>Áp dụng từ</Th>
                    <Th>Đến</Th>
                    <Th>Ưu tiên</Th>
                    <Th>Trạng thái</Th>
                    <Th className="text-right">Hành động</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50">
                      <Td>
                        <Badge tone={pricingTypeTone(rule.type)}>
                          {pricingTypeLabel(rule.type)}
                        </Badge>
                      </Td>
                      <Td className="font-semibold text-brand-700">
                        {formatCurrency(Number(rule.pricePerNight))}
                      </Td>
                      <Td>{rule.startDate ?? "—"}</Td>
                      <Td>{rule.endDate ?? "—"}</Td>
                      <Td>{rule.priority}</Td>
                      <Td>
                        {rule.isActive ? (
                          <Badge tone="emerald">Hoạt động</Badge>
                        ) : (
                          <Badge tone="rose">Đã tắt</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        {rule.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => remove.mutate(rule.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          form.reset();
        }}
        title="Thêm quy tắc giá"
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
          <Select label="Loại phòng" {...form.register("roomTypeId")}>
            <option value="">Chọn loại phòng</option>
            {rtList.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </Select>
          <Select label="Loại giá" {...form.register("type")}>
            <option value="DEFAULT">Mặc định</option>
            <option value="SEASONAL">Theo mùa</option>
            <option value="HOLIDAY">Ngày lễ</option>
          </Select>
          <Input
            label="Giá mỗi đêm (VND)"
            type="number"
            min={1}
            {...form.register("pricePerNight")}
            error={form.formState.errors.pricePerNight?.message}
          />
          <Input
            label="Ưu tiên"
            type="number"
            min={0}
            {...form.register("priority")}
          />
          <Input
            label="Ngày bắt đầu"
            type="date"
            {...form.register("startDate")}
          />
          <Input
            label="Ngày kết thúc"
            type="date"
            {...form.register("endDate")}
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

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Maximize2,
  BedDouble,
  DollarSign,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OperationHeader, hotelFallbackImage } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  description: z.string().optional(),
  maxGuests: z.coerce.number().int().min(1).max(20),
  areaSqm: z.coerce.number().min(1),
  bedType: z.string().min(1),
  amenities: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

interface RoomTypeRow {
  id: string;
  name: string;
  description?: string | null;
  maxGuests: number;
  areaSqm: number;
  bedType: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  _count?: { rooms: number };
  pricingRules?: {
    id: string;
    type: "DEFAULT" | "SEASONAL" | "HOLIDAY";
    pricePerNight: string;
    isActive: boolean;
  }[];
}

export default function AdminRoomTypesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeRow | null>(null);

  const list = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => api.get<RoomTypeRow[]>("/rooms/types").then((r) => r.data),
  });

  const upsert = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        maxGuests: data.maxGuests,
        areaSqm: data.areaSqm,
        bedType: data.bedType,
        amenities: data.amenities
          ? data.amenities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        images: data.imageUrl ? [data.imageUrl] : [],
      };
      if (editing) return api.patch(`/rooms/types/${editing.id}`, payload);
      return api.post("/rooms/types", payload);
    },
    onSuccess: () => {
      toast.success(
        editing ? "Cập nhật thành công" : "Tạo loại phòng thành công",
      );
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/types/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa loại phòng");
      qc.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: (e) => toast.error("Không thể xóa", getApiErrorMessage(e)),
  });

  return (
    <div>
      <OperationHeader
        kicker="Room catalog"
        title="Loại phòng"
        description="Quản lý nội dung thương mại của từng loại phòng: ảnh, mô tả, sức chứa, tiện nghi và giá đang áp dụng."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm loại phòng
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
          ))}
        {list.data && list.data.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="Chưa có loại phòng"
              description="Tạo loại phòng đầu tiên để bắt đầu cung cấp dịch vụ."
            />
          </div>
        )}
        {list.data?.map((rt) => (
          <Card key={rt.id} className="overflow-hidden">
            <div className="relative h-40 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  rt.images?.[0] ||
                  hotelFallbackImage(rt.name)
                }
                alt={rt.name}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  {rt.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {rt._count?.rooms ?? 0} phòng
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-slate-500">
                {rt.description ?? "Không có mô tả"}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <Users className="h-3 w-3" /> {rt.maxGuests} khách
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <Maximize2 className="h-3 w-3" /> {rt.areaSqm}m²
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <BedDouble className="h-3 w-3" /> {rt.bedType}
                </span>
              </div>
              {rt.pricingRules && rt.pricingRules.filter((r) => r.isActive).length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <DollarSign className="h-3 w-3 text-brand-600" />
                  {rt.pricingRules
                    .filter((r) => r.isActive)
                    .slice(0, 3)
                    .map((r) => (
                      <Badge key={r.id} tone={r.type === "HOLIDAY" ? "rose" : r.type === "SEASONAL" ? "amber" : "slate"} className="text-[10px]">
                        {r.type === "HOLIDAY" ? "Lễ" : r.type === "SEASONAL" ? "Mùa" : "Cơ bản"}: {formatCurrency(Number(r.pricePerNight))}
                      </Badge>
                    ))}
                  {rt.pricingRules.filter((r) => r.isActive).length > 3 && (
                    <span className="text-[10px] text-slate-400">
                      +{rt.pricingRules.filter((r) => r.isActive).length - 3}
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(rt);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Sửa
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Xóa loại phòng "${rt.name}"?`))
                      del.mutate(rt.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoomTypeModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSubmit={(d) => upsert.mutate(d)}
        loading={upsert.isPending}
      />
    </div>
  );
}

function RoomTypeModal({
  open,
  onClose,
  onSubmit,
  loading,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: FormValues) => void;
  loading: boolean;
  editing: RoomTypeRow | null;
}) {
  const form = useForm<FormValues>(
    editing
      ? {
          resolver: zodResolver(schema),
          values: {
            name: editing.name,
            description: editing.description ?? "",
            maxGuests: editing.maxGuests,
            areaSqm: editing.areaSqm,
            bedType: editing.bedType,
            amenities: (editing.amenities ?? []).join(", "),
            imageUrl: editing.images?.[0] ?? "",
          },
        }
      : {
          resolver: zodResolver(schema),
          defaultValues: {
            name: "",
            description: "",
            maxGuests: 2,
            areaSqm: 25,
            bedType: "Double",
            amenities: "Wifi, TV, Minibar",
            imageUrl: "",
          },
        },
  );

  const previewUrl = form.watch("imageUrl");
  const fallbackImg = hotelFallbackImage(form.watch("name") ?? "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Cập nhật loại phòng" : "Thêm loại phòng mới"}
      size="xl"
      description="Cấu hình thông tin danh mục loại phòng thương mại. Thông tin này sẽ hiển thị trực tiếp cho khách hàng trên website đặt phòng."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={loading}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Group 1: Basic Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Thông tin cơ bản</h4>
            <p className="mt-0.5 text-xs text-slate-500">Tên thương mại và mô tả hiển thị với khách hàng.</p>
            <div className="mt-4 space-y-4">
              <Input
                label="Tên loại phòng"
                placeholder="Ví dụ: Deluxe Double Room"
                {...form.register("name")}
                error={form.formState.errors.name?.message}
              />
              <Textarea
                label="Mô tả loại phòng"
                rows={3}
                placeholder="Phòng Deluxe cao cấp với không gian rộng rãi, tầm nhìn hướng phố..."
                {...form.register("description")}
              />
            </div>
          </div>

          {/* Group 2: Capacity & Area */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Thông số kỹ thuật</h4>
            <p className="mt-0.5 text-xs text-slate-500">Quy định về diện tích, số giường và sức chứa tối đa.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Loại giường"
                placeholder="Ví dụ: King, Queen, Double"
                {...form.register("bedType")}
                error={form.formState.errors.bedType?.message}
              />
              <Input
                label="Số khách tối đa"
                type="number"
                placeholder="2"
                {...form.register("maxGuests")}
                error={form.formState.errors.maxGuests?.message}
              />
              <Input
                label="Diện tích (m²)"
                type="number"
                step="0.1"
                placeholder="30"
                {...form.register("areaSqm")}
                error={form.formState.errors.areaSqm?.message}
              />
            </div>
          </div>

          {/* Group 3: Amenities & Services */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Tiện nghi phòng</h4>
            <p className="mt-0.5 text-xs text-slate-500">Các tiện nghi được trang bị sẵn trong phòng (phân cách bằng dấu phẩy).</p>
            <div className="mt-4">
              <Input
                label="Danh sách tiện nghi"
                placeholder="Wifi, Điều hòa, TV, Minibar, Bồn tắm, Máy sấy tóc..."
                {...form.register("amenities")}
              />
            </div>
          </div>
        </div>

        {/* Group 4: Image & Preview (Col 3) */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Hình ảnh minh họa</h4>
            <p className="mt-0.5 text-xs text-slate-500">Cung cấp đường dẫn ảnh chất lượng cao làm ảnh đại diện cho loại phòng.</p>
            <div className="mt-4 space-y-4">
              <Input
                label="Ảnh URL"
                placeholder="https://images.unsplash.com/..."
                {...form.register("imageUrl")}
                error={form.formState.errors.imageUrl?.message}
              />
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <div className="aspect-[4/3] w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl || fallbackImg}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImg;
                    }}
                  />
                  <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    Ảnh xem trước
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helper details summary card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kiểm tra thông số hiển thị</h4>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Cấu hình phòng:</span>
                <span className="font-semibold text-slate-900">
                  {form.watch("maxGuests") ?? 2} khách · {form.watch("bedType") || "Double"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Diện tích:</span>
                <span className="font-semibold text-slate-900">{form.watch("areaSqm") ?? 25} m²</span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái chỉnh sửa:</span>
                <span className={`font-semibold ${editing ? "text-amber-600" : "text-brand-600"}`}>
                  {editing ? "Đang sửa loại phòng" : "Tạo loại phòng mới"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

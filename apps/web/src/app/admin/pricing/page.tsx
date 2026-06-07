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

const pricingTypeTone = (t: string) => (t === "HOLIDAY" ? "rose" : t === "SEASONAL" ? "amber" : "slate");

const pricingTypeLabel = (t: string) => (t === "HOLIDAY" ? "Ngày lễ" : t === "SEASONAL" ? "Theo mùa" : "Mặc định");

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
        queryFn: () => api.get("/rooms/types", { params: { includeInactive: true } }).then((r) => r.data),
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
                <Select label="Lọc theo loại phòng" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">Tất cả loại phòng</option>
                    {rtList.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                            {rt.name}
                        </option>
                    ))}
                </Select>
            </div>

            {grouped.map(({ roomType, rules }) => {
                const activeCount = rules.filter((r) => r.isActive).length;
                return (
                    <Card key={roomType.id} className="mt-5 overflow-hidden">
                        <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{roomType.name}</h3>
                                <p className="text-xs text-slate-500">Danh mục cấu hình giá phòng theo các thời điểm</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                                {activeCount} quy tắc đang chạy
                            </span>
                        </div>
                        {rules.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500">
                                Chưa có quy tắc giá nào được cấu hình cho loại phòng này. Giá trị mặc định sẽ là 0 VND.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <Th>Loại giá</Th>
                                            <Th>Giá / đêm</Th>
                                            <Th>Từ ngày</Th>
                                            <Th>Đến ngày</Th>
                                            <Th>Độ ưu tiên</Th>
                                            <Th>Trạng thái</Th>
                                            <Th className="text-right">Hành động</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {rules.map((rule) => (
                                            <tr key={rule.id} className="hover:bg-slate-50/85 transition-colors">
                                                <Td>
                                                    <Badge tone={pricingTypeTone(rule.type)}>{pricingTypeLabel(rule.type)}</Badge>
                                                </Td>
                                                <Td className="font-semibold text-brand-700">{formatCurrency(Number(rule.pricePerNight))}</Td>
                                                <Td>{rule.startDate ? rule.startDate.slice(0, 10) : "—"}</Td>
                                                <Td>{rule.endDate ? rule.endDate.slice(0, 10) : "—"}</Td>
                                                <Td className="font-mono">{rule.priority}</Td>
                                                <Td>{rule.isActive ? <Badge tone="emerald">Hoạt động</Badge> : <Badge tone="rose">Đã tắt</Badge>}</Td>
                                                <Td className="text-right">
                                                    {rule.isActive && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (confirm("Xác nhận vô hiệu hóa quy tắc giá này?")) {
                                                                    remove.mutate(rule.id);
                                                                }
                                                            }}
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
                );
            })}

            <Card className="mt-6">
                <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900">Hướng dẫn cấu hình giá động</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4 border">
                            <p className="font-semibold text-slate-900">1. Quy tắc độ ưu tiên</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                Nếu một ngày có nhiều quy tắc giá giao nhau, hệ thống sẽ chọn quy tắc có độ ưu tiên cao nhất (chỉ số lớn nhất).
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 border">
                            <p className="font-semibold text-slate-900">2. Đè ngày (Overlap)</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                Giá ngày lễ (Holiday) thường được khuyến nghị đặt độ ưu tiên cao nhất, tiếp theo là giá theo mùa (Seasonal), và cuối cùng là giá
                                mặc định (Default).
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4 border">
                            <p className="font-semibold text-slate-900">3. Thời gian áp dụng</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                Quy tắc giá mặc định sẽ không có ngày bắt đầu và ngày kết thúc. Giá này áp dụng cho mọi ngày không có cấu hình đặc biệt khác.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <Modal
                open={open}
                onClose={() => {
                    setOpen(false);
                    form.reset();
                }}
                title="Thêm quy tắc giá mới"
                size="xl"
                description="Thiết lập mức giá động cho phòng. Bạn có thể định nghĩa mức giá cơ bản hoặc các mức giá thay đổi linh hoạt theo mùa hay các kỳ nghỉ lễ."
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setOpen(false);
                                form.reset();
                            }}
                        >
                            Hủy
                        </Button>
                        <Button onClick={form.handleSubmit((d) => create.mutate(d))} loading={create.isPending}>
                            Tạo quy tắc giá
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-5 lg:col-span-2">
                        {/* Group 1: Configuration */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Cấu hình loại phòng & loại giá</h4>
                            <p className="mt-0.5 text-xs text-slate-500">Chọn loại phòng cần cấu hình và loại quy tắc tương ứng.</p>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Select label="Loại phòng" {...form.register("roomTypeId")} error={form.formState.errors.roomTypeId?.message}>
                                    <option value="">Chọn loại phòng</option>
                                    {rtList.map((rt) => (
                                        <option key={rt.id} value={rt.id}>
                                            {rt.name}
                                        </option>
                                    ))}
                                </Select>
                                <Select label="Loại giá" {...form.register("type")}>
                                    <option value="DEFAULT">Mặc định (Trọn đời)</option>
                                    <option value="SEASONAL">Theo mùa</option>
                                    <option value="HOLIDAY">Ngày lễ</option>
                                </Select>
                            </div>
                        </div>

                        {/* Group 2: Pricing details */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Chi tiết giá và độ ưu tiên</h4>
                            <p className="mt-0.5 text-xs text-slate-500">Mức giá áp dụng cho mỗi đêm lưu trú và độ ưu tiên so với quy tắc khác.</p>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    label="Giá mỗi đêm (VND)"
                                    type="number"
                                    min={1}
                                    placeholder="Ví dụ: 1200000"
                                    {...form.register("pricePerNight")}
                                    error={form.formState.errors.pricePerNight?.message}
                                />
                                <Input
                                    label="Mức độ ưu tiên"
                                    type="number"
                                    min={0}
                                    placeholder="Mặc định: 0"
                                    hint="Chỉ số lớn nhất sẽ được ưu tiên chọn khi đè ngày."
                                    {...form.register("priority")}
                                    error={form.formState.errors.priority?.message}
                                />
                            </div>
                        </div>

                        {/* Group 3: Applicable Range (Conditional) */}
                        {form.watch("type") !== "DEFAULT" && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 animate-fade-in">
                                <h4 className="text-sm font-semibold text-slate-900">Khoảng thời gian áp dụng</h4>
                                <p className="mt-0.5 text-xs text-slate-500">Chỉ ra ngày bắt đầu và ngày kết thúc có hiệu lực cho quy tắc giá này.</p>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input label="Ngày bắt đầu" type="date" {...form.register("startDate")} error={form.formState.errors.startDate?.message} />
                                    <Input label="Ngày kết thúc" type="date" {...form.register("endDate")} error={form.formState.errors.endDate?.message} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Group 4: Guidelines sidebar */}
                    <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Khuyến nghị độ ưu tiên</h4>
                            <div className="mt-3 space-y-3 text-xs text-slate-600 leading-5">
                                <div>
                                    <p className="font-semibold text-slate-900">Quy tắc Mặc định (Default):</p>
                                    <p>
                                        Khuyên dùng priority = <span className="font-mono">0</span>. Áp dụng khi không có cấu hình đặc biệt.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Quy tắc Theo mùa (Seasonal):</p>
                                    <p>
                                        Khuyên dùng priority = <span className="font-mono">10</span> đến <span className="font-mono">20</span>. Áp dụng cho các
                                        dịp cao điểm hè/đông.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Quy tắc Ngày lễ (Holiday):</p>
                                    <p>
                                        Khuyên dùng priority = <span className="font-mono">30</span> trở lên. Áp dụng cho Tết, Noel, Giỗ tổ để đè lên giá mùa.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Thông số xem trước</h4>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                <div className="flex justify-between">
                                    <span>Loại quy tắc:</span>
                                    <span className="font-semibold text-slate-900">{form.watch("type")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Độ ưu tiên:</span>
                                    <span className="font-semibold text-slate-900">{form.watch("priority") ?? 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Khoảng ngày:</span>
                                    <span className="font-semibold text-slate-900">
                                        {form.watch("type") === "DEFAULT"
                                            ? "Trọn đời"
                                            : `${form.watch("startDate") || "Chưa chọn"} → ${form.watch("endDate") || "Chưa chọn"}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>{children}</td>;
}

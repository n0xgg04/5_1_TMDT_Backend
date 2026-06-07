"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Lock,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import type { Role } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, "Mật khẩu mạnh"),
  role: z.enum(["RECEPTIONIST", "HOUSEKEEPING", "ADMIN"]),
});
type FormValues = z.infer<typeof schema>;

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface ListResponse {
  items: UserRow[];
  total: number;
  page: number;
  limit: number;
}

const roleLabel: Record<Role, string> = {
  CUSTOMER: "Khách hàng",
  RECEPTIONIST: "Lễ tân",
  HOUSEKEEPING: "Dọn phòng",
  ADMIN: "Quản trị viên",
};

function roleTone(r: Role) {
  return r === "ADMIN"
    ? "violet"
    : r === "RECEPTIONIST"
      ? "sky"
      : r === "HOUSEKEEPING"
        ? "amber"
        : "slate";
}

export default function AdminStaffPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const list = useQuery({
    queryKey: ["users", page, role, search, statusFilter],
    queryFn: () =>
      api
        .get<ListResponse>("/users", {
          params: {
            page,
            limit: 20,
            ...(role ? { role } : {}),
            ...(search ? { search } : {}),
            ...(statusFilter ? { isActive: statusFilter } : {}),
          },
        })
        .then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (data: FormValues) => api.post("/users/staff", data),
    onSuccess: () => {
      toast.success("Tạo nhân viên thành công");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-lock`),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error("Lỗi", getApiErrorMessage(e)),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "RECEPTIONIST" },
  });

  const items: UserRow[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const pages = getPages(page, totalPages);

  return (
    <div>
      <OperationHeader
        kicker="Access"
        title="Người dùng"
        description="Quản lý tài khoản khách hàng và nhân viên, phân quyền, trạng thái khóa/mở."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        }
      />

      <div className="toolbar-panel mt-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input
            label="Tìm kiếm"
            placeholder="Tên hoặc email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-44">
          <Select
            label="Vai trò"
            value={role}
            onChange={(e) => handleFilterChange(setRole, e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="RECEPTIONIST">Lễ tân</option>
            <option value="HOUSEKEEPING">Dọn phòng</option>
            <option value="CUSTOMER">Khách hàng</option>
          </Select>
        </div>
        <div className="w-44">
          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Đã khóa</option>
          </Select>
        </div>

        <p className="ml-auto pb-2 text-sm text-slate-500">
          {total} người dùng
        </p>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Họ tên</Th>
                <Th>Email</Th>
                <Th>Vai trò</Th>
                <Th>Trạng thái</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {list.isLoading && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="p-4" colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!list.isLoading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td className="font-semibold text-slate-900">
                    {u.firstName} {u.lastName}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge tone={roleTone(u.role)}>{roleLabel[u.role]}</Badge>
                  </Td>
                  <Td>
                    {u.isActive ? (
                      <Badge tone="emerald">Hoạt động</Badge>
                    ) : (
                      <Badge tone="rose">Đã khóa</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant={u.isActive ? "outline" : "primary"}
                      onClick={() => toggle.mutate(u.id)}
                    >
                      {u.isActive ? (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Khóa
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5" /> Mở khóa
                        </>
                      )}
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-500">
              Trang {page}/{totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pages.map((p, i) =>
                p === "..." ? (
                  <span key={`dot-${i}`} className="px-2 text-sm text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? "bg-brand-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm nhân viên"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
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
            label="Họ"
            {...form.register("firstName")}
            error={form.formState.errors.firstName?.message}
          />
          <Input
            label="Tên"
            {...form.register("lastName")}
            error={form.formState.errors.lastName?.message}
          />
          <Input
            label="Email"
            type="email"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          <Input label="SĐT" {...form.register("phone")} />
          <Input
            label="Mật khẩu tạm"
            type="password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
          <Select label="Vai trò" {...form.register("role")}>
            <option value="RECEPTIONIST">Lễ tân</option>
            <option value="HOUSEKEEPING">Dọn phòng</option>
            <option value="ADMIN">Quản trị viên</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}

function getPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
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

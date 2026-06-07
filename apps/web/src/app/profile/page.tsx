"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Lock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Save,
  Eye,
  EyeOff,
  Shield,
  UserCircle,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import type { AuthUser, Role } from "@/lib/types";

type Tab = "profile" | "password";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Tài khoản của tôi</h1>
      <p className="mt-1 text-sm text-slate-500">
        Quản lý thông tin cá nhân và bảo mật
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="shrink-0 lg:w-64">
          <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
            <TabButton
              active={tab === "profile"}
              onClick={() => setTab("profile")}
              icon={<User className="h-4 w-4" />}
              label="Thông tin cá nhân"
            />
            <TabButton
              active={tab === "password"}
              onClick={() => setTab("password")}
              icon={<Lock className="h-4 w-4" />}
              label="Đổi mật khẩu"
            />
          </div>
        </aside>

        <div className="flex-1">
          {tab === "profile" && <ProfileSection />}
          {tab === "password" && <PasswordSection />}
        </div>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const roleLabel: Record<Role, string> = {
  CUSTOMER: "Khách hàng",
  RECEPTIONIST: "Lễ tân",
  HOUSEKEEPING: "Dọn phòng",
  ADMIN: "Quản trị viên",
};

const roleTone: Record<Role, "brand" | "sky" | "amber" | "violet"> = {
  CUSTOMER: "brand",
  RECEPTIONIST: "sky",
  HOUSEKEEPING: "amber",
  ADMIN: "violet",
};

function ProfileSection() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      api.get<AuthUser & { createdAt: string }>("/auth/me").then((r) => r.data),
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (me.data) {
      setFirstName(me.data.firstName);
      setLastName(me.data.lastName);
      setPhone(me.data.phone ?? "");
    }
  }, [me.data]);

  const update = useMutation({
    mutationFn: (body: {
      firstName: string;
      lastName: string;
      phone: string;
    }) => api.patch("/auth/me", body).then((r) => r.data),
    onSuccess: (updated) => {
      toast.success("Cập nhật thành công");
      setUser(updated as AuthUser);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const canSave =
    me.data &&
    (firstName !== me.data.firstName ||
      lastName !== me.data.lastName ||
      phone !== (me.data.phone ?? ""));

  if (me.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (me.error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-5 w-5" />}
        title="Không thể tải"
        description={getApiErrorMessage(me.error)}
      />
    );
  }

  const data = me.data!;
  const initials = (data.lastName?.charAt(0) ?? "") + (data.firstName?.charAt(0) ?? "");

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-4 ring-brand-50">
              <span className="text-xl font-bold uppercase">
                {initials || <UserCircle className="h-7 w-7" />}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">
                {data.lastName} {data.firstName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge tone={roleTone[data.role]}>
                  <Shield className="h-3 w-3" />
                  {roleLabel[data.role]}
                </Badge>
                <span className="text-xs text-slate-400">
                  <Calendar className="-mt-0.5 mr-1 inline-block h-3 w-3" />
                  Tham gia {formatDate(data.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
          <CardDescription>
            Thông tin cơ bản về tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Email</p>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-900">{data.email}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Vai trò</p>
              <div className="mt-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
                <Badge tone={roleTone[data.role]}>{roleLabel[data.role]}</Badge>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Ngày tham gia</p>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-900">
                  {formatDate(data.createdAt)}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Mã tài khoản</p>
              <div className="mt-1 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-mono text-slate-600">
                  {data.id.slice(0, 12)}...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>
            Cập nhật thông tin cá nhân của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              placeholder="Nhập họ của bạn"
            />
            <Input
              label="Tên"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              placeholder="Nhập tên của bạn"
            />
            <div>
              <Input
                label="Email"
                value={data.email}
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <p className="mt-1 text-xs text-slate-400">
                Email không thể thay đổi
              </p>
            </div>
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
              placeholder="Nhập số điện thoại"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => update.mutate({ firstName, lastName, phone })}
            loading={update.isPending}
            disabled={!canSave}
          >
            <Save className="mr-1 h-4 w-4" /> Lưu thay đổi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const change = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.patch("/auth/change-password", body).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const canSubmit =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword;

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Đổi mật khẩu</h2>
        <div className="mt-4 max-w-md space-y-4">
          <div className="relative">
            <Input
              label="Mật khẩu hiện tại"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-[2.1rem] text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="relative">
            <Input
              label="Mật khẩu mới"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-[2.1rem] text-slate-400 hover:text-slate-600"
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<CheckCircle className="h-4 w-4" />}
          />
          {newPassword &&
            confirmPassword &&
            newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">
                Mật khẩu xác nhận không khớp
              </p>
            )}
          <div className="pt-2">
            <Button
              onClick={() => change.mutate({ currentPassword, newPassword })}
              disabled={!canSubmit}
              loading={change.isPending}
            >
              <Save className="mr-1 h-4 w-4" /> Cập nhật mật khẩu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

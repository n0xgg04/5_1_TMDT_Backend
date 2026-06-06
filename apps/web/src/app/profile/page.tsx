"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Save,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { StripeProvider } from "@/components/stripe-provider";
import { VisaCardForm } from "@/components/visa-card-form";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import type { AuthUser, UserPaymentMethod } from "@/lib/types";

type Tab = "profile" | "payment" | "password";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Tài khoản của tôi</h1>
      <p className="mt-1 text-sm text-slate-500">
        Quản lý thông tin cá nhân, phương thức thanh toán và bảo mật
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
              active={tab === "payment"}
              onClick={() => setTab("payment")}
              icon={<CreditCard className="h-4 w-4" />}
              label="Phương thức thanh toán"
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
          {tab === "payment" && <PaymentSection />}
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

  useState(() => {
    if (me.data) {
      setFirstName(me.data.firstName);
      setLastName(me.data.lastName);
      setPhone(me.data.phone ?? "");
    }
  });

  const data = me.data;
  const isLoaded = !!data && firstName === "";
  if (isLoaded) {
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setPhone(data.phone ?? "");
  }

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

  if (me.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
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

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Thông tin cá nhân
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Họ"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
          />
          <Input
            label="Tên"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
          />
          <Input
            label="Email"
            value={data?.email ?? ""}
            disabled
            leftIcon={<Mail className="h-4 w-4" />}
          />
          <Input
            label="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="h-4 w-4" />}
          />
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          Tham gia từ {data?.createdAt ? formatDate(data.createdAt) : "-"}
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => update.mutate({ firstName, lastName, phone })}
            loading={update.isPending}
          >
            <Save className="mr-1 h-4 w-4" /> Lưu thay đổi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentSection() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [type, setType] = useState("VNPAY");
  const [label, setLabel] = useState("");

  const q = useQuery({
    queryKey: ["user-payment-methods"],
    queryFn: () =>
      api.get<UserPaymentMethod[]>("/user-payment-methods").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (body: {
      type: string;
      label: string;
      details?: Record<string, unknown>;
    }) => api.post("/user-payment-methods", body).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã thêm phương thức thanh toán");
      setShowAdd(false);
      setShowVisaModal(false);
      setLabel("");
      qc.invalidateQueries({ queryKey: ["user-payment-methods"] });
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/user-payment-methods/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã xóa");
      qc.invalidateQueries({ queryKey: ["user-payment-methods"] });
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/user-payment-methods/${id}`, { isDefault: true })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã đặt mặc định");
      qc.invalidateQueries({ queryKey: ["user-payment-methods"] });
    },
    onError: (err) => toast.error("Lỗi", getApiErrorMessage(err)),
  });

  const types = [
    { value: "VNPAY", label: "VNPay" },
    { value: "MOMO", label: "Momo" },
    { value: "VISA", label: "VISA" },
    { value: "SHOPEEPAY", label: "ShopeePay" },
    { value: "CASH", label: "Tiền mặt" },
  ];

  const handleAddClick = () => {
    if (type === "VISA") {
      setShowVisaModal(true);
    }
  };

  const handleVisaSuccess = (paymentMethodId: string, last4: string) => {
    create.mutate({
      type: "VISA",
      label: label || `VISA ****${last4}`,
      details: { paymentMethodId, last4 },
    });
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Phương thức thanh toán
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý các phương thức thanh toán của bạn
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Thêm
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {q.isLoading && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}
          {q.data?.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {pm.label}
                </p>
                <p className="text-xs text-slate-500">{pm.type}</p>
              </div>
              <div className="flex items-center gap-2">
                {pm.isDefault ? (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600">
                    Mặc định
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDefault.mutate(pm.id)}
                    loading={setDefault.isPending}
                  >
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    confirm("Xóa phương thức này?") && del.mutate(pm.id)
                  }
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
          {q.data?.length === 0 && (
            <EmptyState
              icon={<CreditCard className="h-5 w-5" />}
              title="Chưa có phương thức thanh toán"
              description="Thêm VNPay, Momo, VISA, ShopeePay để thanh toán nhanh hơn."
            />
          )}
        </div>

        {showAdd && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Thêm phương thức mới
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Loại
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setLabel(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                >
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Tên hiển thị"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VD: Thẻ VISA của tôi"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>
                Hủy
              </Button>
              {type === "VISA" ? (
                <Button onClick={handleAddClick} disabled={!label.trim()}>
                  <CreditCard className="mr-1 h-4 w-4" /> Nhập thông tin thẻ
                </Button>
              ) : (
                <Button
                  onClick={() => create.mutate({ type, label: label || type })}
                  loading={create.isPending}
                  disabled={!label.trim()}
                >
                  <Save className="mr-1 h-4 w-4" /> Lưu
                </Button>
              )}
            </div>
          </div>
        )}

        <Modal
          open={showVisaModal}
          onClose={() => setShowVisaModal(false)}
          title="Thêm thẻ Visa"
          description="Nhập thông tin thẻ để lưu phương thức thanh toán"
          size="md"
        >
          <StripeProvider>
            <VisaCardForm
              onSuccess={handleVisaSuccess}
              onCancel={() => setShowVisaModal(false)}
            />
          </StripeProvider>
        </Modal>
      </CardContent>
    </Card>
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

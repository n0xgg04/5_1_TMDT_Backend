"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ticket,
  Calendar,
  Percent,
  Banknote,
  AlertCircle,
  ChevronRight,
  Tag,
  Gift,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { UserCoupon, CouponPublic } from "@/lib/types";

export default function MyCouponsPage() {
  const [selected, setSelected] = useState<UserCoupon | null>(null);
  const qc = useQueryClient();

  const myQ = useQuery({
    queryKey: ["my-coupons"],
    queryFn: () =>
      api.get<UserCoupon[]>("/coupons/my-coupons").then((r) => r.data),
  });

  const publicQ = useQuery({
    queryKey: ["public-coupons"],
    queryFn: () =>
      api.get<CouponPublic[]>("/coupons/public").then((r) => r.data),
  });

  const claimM = useMutation({
    mutationFn: (id: string) =>
      api.post(`/coupons/${id}/claim`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã lưu mã ưu đãi");
      qc.invalidateQueries({ queryKey: ["my-coupons"] });
      qc.invalidateQueries({ queryKey: ["public-coupons"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Ưu đãi của tôi</h1>
      <p className="mt-1 text-sm text-slate-500">
        Các mã giảm giá bạn đang sở hữu
      </p>

      <div className="mt-6 space-y-4">
        {myQ.isLoading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </>
        )}
        {myQ.error && (
          <EmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="Không thể tải"
            description={getApiErrorMessage(myQ.error)}
          />
        )}
        {myQ.data && myQ.data.length === 0 && (
          <EmptyState
            icon={<Ticket className="h-5 w-5" />}
            title="Chưa có ưu đãi nào"
            description="Hãy lưu các mã ưu đãi bên dưới để sử dụng khi đặt phòng."
          />
        )}
        {myQ.data?.map((uc) => (
          <button
            key={uc.id}
            onClick={() => setSelected(uc)}
            className="w-full text-left"
          >
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Tag className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {uc.coupon.code}
                    </p>
                    {uc.isUsed ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        Đã dùng
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        Chưa dùng
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {uc.coupon.type === "percentage"
                      ? `Giảm ${uc.coupon.value}%`
                      : `Giảm ${formatCurrency(uc.coupon.value)}`}
                    {" · HSD "}
                    {formatDate(uc.coupon.endDate)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-brand-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Các chương trình ưu đãi
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Lưu mã ưu đãi để sử dụng khi đặt phòng
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicQ.isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          {publicQ.data?.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {c.code}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.type === "percentage"
                      ? `Giảm ${c.value}%`
                      : `Giảm ${formatCurrency(c.value)}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {c.minAmount && (
                  <p>Đơn tối thiểu: {formatCurrency(c.minAmount)}</p>
                )}
                {c.maxDiscount && (
                  <p>Giảm tối đa: {formatCurrency(c.maxDiscount)}</p>
                )}
                <p>HSD: {formatDate(c.endDate)}</p>
              </div>
              <Button
                size="sm"
                className="mt-3 w-full"
                disabled={c.isClaimed || claimM.isPending}
                onClick={() => claimM.mutate(c.id)}
              >
                {c.isClaimed ? "Đã lưu" : "Lưu mã"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Chi tiết ưu đãi"
        size="sm"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {selected.coupon.code}
                </p>
                <p className="text-sm text-slate-500">
                  {selected.coupon.type === "percentage"
                    ? `Giảm ${selected.coupon.value}%`
                    : `Giảm ${formatCurrency(selected.coupon.value)}`}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>
                  Hiệu lực: {formatDate(selected.coupon.startDate)} -{" "}
                  {formatDate(selected.coupon.endDate)}
                </span>
              </div>
              {selected.coupon.minAmount && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Banknote className="h-4 w-4 text-slate-400" />
                  <span>
                    Đơn tối thiểu: {formatCurrency(selected.coupon.minAmount)}
                  </span>
                </div>
              )}
              {selected.coupon.maxDiscount && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Percent className="h-4 w-4 text-slate-400" />
                  <span>
                    Giảm tối đa: {formatCurrency(selected.coupon.maxDiscount)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Ticket className="h-4 w-4 text-slate-400" />
                <span>
                  Đã dùng {selected.coupon.usageCount} /{" "}
                  {selected.coupon.usageLimit} lượt
                </span>
              </div>
              {selected.isUsed && selected.usedAt && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Sử dụng lúc: {formatDate(selected.usedAt)}</span>
                </div>
              )}
            </div>

            {!selected.isUsed && (
              <Button
                className="w-full"
                onClick={() => (window.location.href = "/rooms")}
              >
                Đặt phòng ngay
              </Button>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}

"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1e293b",
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#ef4444",
    },
  },
};

interface VisaCardFormProps {
  onSuccess: (paymentMethodId: string, last4: string) => void;
  onCancel: () => void;
}

export function VisaCardForm({ onSuccess, onCancel }: VisaCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe chưa sẵn sàng");
      return;
    }

    setIsLoading(true);
    setCardError(null);

    try {
      const { clientSecret } = await api
        .post("/payments/stripe/setup-intent")
        .then((r) => r.data);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Không tìm thấy card element");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        setCardError(error.message ?? "Lỗi thẻ");
        return;
      }

      const confirmResult = await api
        .post("/payments/stripe/confirm-setup", {
          clientSecret,
          paymentMethodId: paymentMethod.id,
        })
        .then((r) => r.data);

      if (confirmResult.status === "succeeded") {
        toast.success("Thêm thẻ Visa thành công");
        onSuccess(paymentMethod.id, confirmResult.last4);
      } else {
        setCardError("Xác nhận thẻ thất bại");
      }
    } catch (err) {
      toast.error("Lỗi", getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Thông tin thẻ được bảo mật bởi Stripe</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-xs font-medium text-slate-700">
          Số thẻ
        </label>
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="flex-1">
            <CardElement
              options={cardElementOptions}
              onChange={(event) => {
                if (event.error) {
                  setCardError(event.error.message);
                } else {
                  setCardError(null);
                }
              }}
            />
          </div>
        </div>
      </div>

      {cardError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{cardError}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button type="submit" loading={isLoading} disabled={!stripe}>
          <CreditCard className="mr-1 h-4 w-4" />
          {isLoading ? "Đang xử lý..." : "Lưu thẻ Visa"}
        </Button>
      </div>
    </form>
  );
}

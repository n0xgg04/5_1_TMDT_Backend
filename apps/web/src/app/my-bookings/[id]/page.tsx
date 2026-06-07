"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  Tag,
  MapPin,
  BedDouble,
  CreditCard,
  Banknote,
  XCircle,
  Star,
  MessageSquare,
  Send,
  Copy,
  CheckCircle2,
  QrCode,
  X,
  RefreshCw,
  Building2,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  BookingStatusBadge,
  bookingStatusAction,
} from "@/components/ui/badge";
import { BookingStatePanel, hotelFallbackImage } from "@/components/hotel/commercial";
import { toast } from "@/lib/toast";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  diffNights,
} from "@/lib/utils";
import { useChatRealtime } from "@/hooks/use-chat-realtime";
import { mergeMessageIntoConversation } from "@/lib/chat-cache";
import type {
  Booking,
  BookingStatus,
  ChatMessageCreatedEvent,
  Conversation,
} from "@/lib/types";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [chatStreamConnected, setChatStreamConnected] = useState(false);
  const [bankTransferResult, setBankTransferResult] = useState<{
    paymentCode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    amount: number;
    paymentDeadline?: string;
  } | null>(null);
  const [showQr, setShowQr] = useState(false);

  const q = useQuery({
    queryKey: ["booking", id],
    enabled: !!id,
    queryFn: () => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING_HOST_APPROVAL" || status === "PENDING_PAYMENT"
        ? 5000
        : false;
    },
  });

  // Tự động đóng QR + hiện thông báo khi booking được confirm
  const [prevStatus, setPrevStatus] = useState(q.data?.status);
  useEffect(() => {
    const prev = prevStatus;
    const curr = q.data?.status;
    if (prev !== curr) {
      setPrevStatus(curr);
      if (
        prev === "PENDING_PAYMENT" &&
        (curr === "CONFIRMED" || curr === "CHECKED_IN")
      ) {
        setShowQr(false);
        setBankTransferResult(null);
        qc.invalidateQueries({ queryKey: ["booking", id] });
        toast.success("Thanh toán thành công!", "Đơn đã được xác nhận.");
      }
      if (prev === "PENDING_HOST_APPROVAL" && curr === "PENDING_PAYMENT") {
        toast.success("Yêu cầu đã được duyệt!", "Bạn có thể thanh toán ngay.");
      }
    }
  }, [q.data?.status, prevStatus]);

  const [cancelDialog, setCancelDialog] = useState<{
    refundPercent: number;
    refundAmount: number;
  } | null>(null);
  const [refundAutoShow, setRefundAutoShow] = useState(false);

  const prefetchRefund = useMutation({
    mutationFn: () =>
      api
        .get<{ refundPercent: number; refundAmount: number }>(
          `/bookings/${id}/refund`,
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      setCancelDialog(data);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const cancelM = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã hủy đơn");
      if (cancelDialog && cancelDialog.refundAmount > 0) {
        setRefundAutoShow(true);
      }
      setCancelDialog(null);
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => {
      setCancelDialog(null);
      toast.error(getApiErrorMessage(err));
    },
  });

  const payLaterM = useMutation({
    mutationFn: () =>
      api
        .post(`/payments/initiate`, {
          bookingId: id,
          method: "CASH",
          couponCode: couponCode.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Đã chọn thanh toán tại quầy");
      qc.invalidateQueries({ queryKey: ["booking", id] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const bankTransferM = useMutation({
    mutationFn: () =>
      api
        .post(`/payments/initiate`, {
          bookingId: id,
          method: "BANK_TRANSFER",
          couponCode: couponCode.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setBankTransferResult(data);
      setShowQr(true);
      toast.success("Quét mã QR để chuyển khoản");
      qc.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const chatQ = useQuery({
    queryKey: ["booking-chat", id],
    enabled: !!q.data,
    refetchInterval: chatStreamConnected ? false : 5000,
    queryFn: () =>
      api
        .get<Conversation>(`/chat/conversation/booking/${id}`)
        .then((r) => r.data),
  });

  const handleChatMessage = useCallback(
    (event: ChatMessageCreatedEvent) => {
      if (event.bookingId !== id) return;
      qc.setQueryData<Conversation>(["booking-chat", id], (current) =>
        mergeMessageIntoConversation(current, event) as Conversation,
      );
    },
    [id, qc],
  );

  useChatRealtime({
    enabled: Boolean(q.data && chatQ.data?.id),
    onMessage: handleChatMessage,
    onReconnect: () => {
      qc.invalidateQueries({ queryKey: ["booking-chat", id] });
    },
    onConnectionChange: setChatStreamConnected,
  });

  const sendMessageM = useMutation({
    mutationFn: (content: string) =>
      api
        .post(`/chat/conversation/${chatQ.data?.id}/messages`, { content })
        .then((r) => r.data),
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["booking-chat", id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (q.isLoading) return <DetailSkeleton />;
  if (q.error || !q.data)
    return (
      <main className="container-page py-10">
        <EmptyState
          title="Không tìm thấy đơn"
          description={
            q.error ? getApiErrorMessage(q.error) : "Đơn không tồn tại."
          }
        />
      </main>
    );

  const b = q.data;
  const nights = diffNights(b.checkIn, b.checkOut);
  const canCancel: BookingStatus[] = [
    "PENDING_HOST_APPROVAL",
    "PENDING_PAYMENT",
    "PAYING",
  ];
  const canPayLaterAtDesk =
    b.status === "PENDING_PAYMENT" && !b.payment?.gatewayUrl;
  const canReview = b.status === "CHECKED_OUT" && !b.review;
  const fallbackImg = hotelFallbackImage(b.room?.roomType?.name ?? "");
  const roomImg = b.room?.roomType?.images?.[0] ?? fallbackImg;

  return (
    <main className="customer-page">
      <div className="container-page py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg shadow-card">
            <img
              src={roomImg}
              alt={b.room?.roomType?.name ?? "Phòng"}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink-950">
                {b.room?.roomType?.name ?? "Phòng"} · #{b.room?.roomNumber}
              </h1>
              <BookingStatusBadge status={b.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Tag className="mr-1 inline h-3.5 w-3.5" />
              {b.bookingCode}
            </p>
          </div>

          <BookingStatePanel
            status={b.status}
            deadline={
              b.status === "PENDING_HOST_APPROVAL" && b.approvalDeadline
                ? formatDateTime(b.approvalDeadline)
                : (b.status === "PENDING_PAYMENT" || b.status === "PAYING") && b.paymentDeadline
                  ? formatDateTime(b.paymentDeadline)
                  : undefined
            }
            title={bookingStatusAction(b.status)}
            description={
              b.status === "PENDING_PAYMENT" || b.status === "PAYING"
                ? "Yêu cầu của bạn đã được duyệt. Vui lòng thanh toán trong thời hạn để giữ phòng — bạn có thể chuyển khoản ngân hàng hoặc thanh toán tại quầy."
                : b.status === "CONFIRMED" && b.payment?.status !== "COMPLETED"
                  ? "Phòng đã được giữ cho bạn. Vui lòng đến quầy lễ tân thanh toán trước khi check-in. Đơn sẽ tự động hủy nếu bạn không đến trong vòng 2 giờ kể từ giờ nhận phòng."
                : b.status === "PENDING_HOST_APPROVAL"
                  ? "Đội ngũ chúng tôi đang kiểm tra lịch phòng. Bạn có thể trao đổi trực tiếp với chúng tôi bên dưới nếu cần hỗ trợ gấp."
                  : undefined
            }
          />

          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                Thông tin lưu trú
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Nhận phòng"
                  value={`${formatDate(b.checkIn)} ${b.checkInTime ? `(${b.checkInTime})` : ""}`}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Trả phòng"
                  value={`${formatDate(b.checkOut)} ${b.checkOutTime ? `(${b.checkOutTime})` : ""}`}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Số đêm"
                  value={`${nights} đêm`}
                />
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Khách"
                  value={`${b.adults ?? 1} người lớn${b.children ? `, ${b.children} trẻ em` : ""}`}
                />
                <InfoRow
                  icon={<BedDouble className="h-4 w-4" />}
                  label="Loại giường"
                  value={b.room?.roomType?.bedType ?? "-"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Chi nhánh"
                  value={b.room?.branch?.name ?? "-"}
                />
              </div>
              {b.specialRequests && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-medium">Yêu cầu đặc biệt:</span>{" "}
                  {b.specialRequests}
                </div>
              )}
              {b.rejectedReason && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  <span className="font-medium">Lý do từ chối:</span>{" "}
                  {b.rejectedReason}
                </div>
              )}
              {b.status === "PENDING_HOST_APPROVAL" &&
                b.approvalDeadline && (
                  <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-700">
                    <span className="font-medium">Thời hạn duyệt:</span>{" "}
                    {formatDateTime(b.approvalDeadline)}
                  </div>
                )}
              {(b.status === "PENDING_PAYMENT" || b.status === "PAYING") && b.paymentDeadline && (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  <span className="font-medium">Thời hạn thanh toán:</span>{" "}
                  {formatDateTime(b.paymentDeadline)}
                </div>
              )}
              {b.status === "CONFIRMED" && b.payment?.status !== "COMPLETED" && (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  <span className="font-medium">Thanh toán tại quầy:</span> Booking đã được xác nhận giữ chỗ, nhưng lễ tân phải thu tiền trước khi làm thủ tục nhận phòng.
                </div>
              )}
            </CardContent>
          </Card>

          {b && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-brand-600" />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Hỗ trợ đơn #{b.bookingCode}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {b.room?.roomType?.name ?? "Phòng"} · #{b.room?.roomNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
                  {chatQ.isLoading ? (
                    <p className="text-sm text-slate-500">Đang tải tin nhắn...</p>
                  ) : !chatQ.data?.messages?.length ? (
                    <p className="text-sm text-slate-500">
                      Hãy gửi tin nhắn nếu bạn cần hỗ trợ thêm về yêu cầu này.
                    </p>
                  ) : (
                    chatQ.data.messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              mine
                                ? "bg-brand-600 text-white"
                                : "bg-white text-slate-700 ring-1 ring-slate-200"
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn hỗ trợ..."
                    className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
                  />
                  <Button
                    onClick={() => {
                      const content = message.trim();
                      if (content) sendMessageM.mutate(content);
                    }}
                    disabled={!chatQ.data?.id || chatQ.isLoading}
                    loading={sendMessageM.isPending}
                  >
                    <Send className="h-4 w-4" /> Gửi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-24 overflow-hidden">
            <div className="bg-ink-950 p-5 text-white">
              <p className="text-sm text-white/70">Chi tiết giá</p>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(b.totalAmount)}
              </p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tổng tiền</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </div>
                {b.payment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Thanh toán</span>
                    <span className={b.payment.status === "COMPLETED" ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                      {formatCurrency(b.payment.amount)} (
                      {b.payment.method})
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">
                    Tình trạng
                  </span>
                  <BookingStatusBadge status={b.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {canPayLaterAtDesk && !bankTransferResult && (
                  <div className="space-y-2">
                    {b.status === "PENDING_PAYMENT" && (
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Mã giảm giá"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500"
                      />
                    )}
                    <Button
                      className="w-full"
                      variant="accent"
                      onClick={() => bankTransferM.mutate()}
                      loading={bankTransferM.isPending}
                    >
                      <Banknote className="mr-2 h-4 w-4" /> Chuyển khoản ngân hàng
                    </Button>
                    <Button
                      className="w-full"
                      variant="ghost"
                      onClick={() => payLaterM.mutate()}
                      loading={payLaterM.isPending}
                    >
                      <Banknote className="mr-2 h-4 w-4" /> Thanh toán tại quầy
                    </Button>
                  </div>
                )}
                {bankTransferResult && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-800">
                        Thông tin chuyển khoản
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ngân hàng:</span>
                        <span className="font-medium">{bankTransferResult.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Số tài khoản:</span>
                        <span className="font-mono font-medium">{bankTransferResult.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Chủ tài khoản:</span>
                        <span className="font-medium">{bankTransferResult.accountHolder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Số tiền:</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(bankTransferResult.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Nội dung CK:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-brand-700 bg-white px-2 py-0.5 rounded border">
                            {bankTransferResult.paymentCode}
                          </span>
                          <button
                            type="button"
                            className="text-brand-600 hover:text-brand-800"
                            onClick={() => {
                              navigator.clipboard.writeText(bankTransferResult.paymentCode);
                              toast.success("Đã sao mã", "Dán vào nội dung chuyển khoản");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" variant="accent" onClick={() => setShowQr(true)}>
                      <QrCode className="mr-2 h-4 w-4" /> Xem mã QR chuyển khoản
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      Hệ thống sẽ tự động xác nhận khi nhận được chuyển khoản với mã trên.
                    </p>
                  </div>
                )}
                {canCancel.includes(b.status) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (b.payment?.status === "COMPLETED") {
                        prefetchRefund.mutate();
                      } else {
                        cancelM.mutate();
                      }
                    }}
                    loading={prefetchRefund.isPending || cancelM.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Hủy đơn
                  </Button>
                )}
                {canReview && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/my-bookings/${id}/review`)}
                  >
                    <Star className="mr-2 h-4 w-4" /> Viết đánh giá
                  </Button>
                )}
              </div>

              {b.status === "CANCELLED" &&
                b.payment?.status === "COMPLETED" && (
                  <RefundSection booking={b} autoShow={refundAutoShow} onAutoShowDone={() => setRefundAutoShow(false)} />
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        title="Xác nhận hủy đơn"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelDialog(null)}>
              Không hủy
            </Button>
            <Button
              variant="danger"
              loading={cancelM.isPending}
              onClick={() => cancelM.mutate()}
            >
              Xác nhận hủy đơn
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          {cancelDialog && cancelDialog.refundAmount > 0 ? (
            <>
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-base font-bold text-blue-900">
                  Bạn sẽ được hoàn{" "}
                  <span className="text-xl">{formatCurrency(cancelDialog.refundAmount)}</span>
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Tỷ lệ hoàn: {cancelDialog.refundPercent}% · Chính sách: trên 7 ngày 100%, 3-7 ngày 70%, 1-3 ngày 50%, dưới 1 ngày 30%
                </p>
              </div>
              <p className="text-center">
                Sau khi hủy, bạn sẽ được yêu cầu nhập thông tin tài khoản ngân hàng để nhận tiền hoàn.
              </p>
              <p className="text-center font-medium text-rose-600">
                Vẫn muốn hủy đơn chứ?
              </p>
            </>
          ) : (
            <>
              <p>
                Bạn sắp hủy đơn này. Đơn của bạn hiện không đủ điều kiện hoàn tiền (đã sát giờ check-in hoặc chưa thanh toán).
              </p>
              <p className="font-medium text-rose-600">
                Vẫn muốn hủy đơn chứ?
              </p>
            </>
          )}
        </div>
      </Modal>
      </div>

      {/* QR Popup Modal */}
      {showQr && bankTransferResult && (() => {
        const qrAmount = Number(bankTransferResult.amount);
        const qrCode = encodeURIComponent(bankTransferResult.paymentCode);
        const qrAccountName = encodeURIComponent(bankTransferResult.accountHolder);
        const qrUrl = `https://img.vietqr.io/image/mb-${bankTransferResult.accountNumber}-qr.png?amount=${qrAmount}&addInfo=${qrCode}&accountName=${qrAccountName}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative">
              <button
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                onClick={() => setShowQr(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-center text-lg font-bold text-slate-900">
                Quét mã QR để thanh toán
              </h3>
              <p className="mt-1 text-center text-sm text-slate-500">
                {bankTransferResult.bankName} - {bankTransferResult.accountNumber}
              </p>
              <div className="mt-4 flex flex-col items-center gap-3">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="h-56 w-56 rounded-xl border border-slate-200"
                />
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(bankTransferResult.amount)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Nội dung: <span className="font-mono font-bold text-brand-700">{bankTransferResult.paymentCode}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Chủ TK: {bankTransferResult.accountHolder}
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => setShowQr(false)}
              >
                Đóng
              </Button>
              <p className="mt-2 text-xs text-slate-400 text-center">
                Mở app ngân hàng, quét mã QR để chuyển khoản nhanh
              </p>
            </div>
          </div>
        );
      })()}

    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function RefundSection({
  booking,
  autoShow,
  onAutoShowDone,
}: {
  booking: Booking;
  autoShow?: boolean;
  onAutoShowDone?: () => void;
}) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [refundInfo, setRefundInfo] = useState<{
    refundPercent: number;
    refundAmount: number;
  } | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const checkRefund = useMutation({
    mutationFn: () =>
      api
        .get<{ refundPercent: number; refundAmount: number }>(
          `/bookings/${booking.id}/refund`,
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      setRefundInfo(data);
      setShowForm(true);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const submitRefund = useMutation({
    mutationFn: () =>
      api.post(`/bookings/${booking.id}/refund-request`, {
        accountHolder,
        accountNumber,
        bankName,
        bankBranch: bankBranch || undefined,
      }),
    onSuccess: () => {
      toast.success(
        "Đã gửi yêu cầu hoàn tiền",
        "Ban quản lý sẽ xử lý trong 1-3 ngày làm việc",
      );
      setAlreadySubmitted(true);
      qc.invalidateQueries({ queryKey: ["booking", booking.id] });
      setShowForm(false);
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      if (msg.includes("Đã gửi yêu cầu")) {
        setAlreadySubmitted(true);
        toast.info("Yêu cầu hoàn tiền đã được gửi trước đó");
      } else {
        toast.error(msg);
      }
    },
  });

  useEffect(() => {
    if (autoShow && !showForm) {
      checkRefund.mutate(undefined, {
        onSettled: () => onAutoShowDone?.(),
      });
    }
  }, [autoShow]);

  if (!showForm) {
    return (
      <div className="border-t border-slate-100 pt-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => checkRefund.mutate()}
          loading={checkRefund.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Tính số tiền hoàn trả
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-3">
      {refundInfo && (
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm">
          <p className="font-semibold text-blue-900">
            Số tiền dự kiến hoàn trả: {formatCurrency(refundInfo.refundAmount)}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            Tỷ lệ hoàn: {refundInfo.refundPercent}% · Chính sách: trên 7 ngày 100%, 3-7 ngày 70%, 1-3 ngày 50%, dưới 1 ngày 30%, sau check-in 0%
          </p>
        </div>
      )}

      {alreadySubmitted ? (
        <div className="rounded-xl bg-green-50 p-4 text-center text-sm">
          <p className="font-semibold text-green-900">
            Yêu cầu hoàn tiền đã được gửi
          </p>
          <p className="mt-1 text-xs text-green-700">
            Ban quản lý sẽ xử lý trong 1-3 ngày làm việc. Vui lòng kiểm tra lại sau.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            label="Chủ tài khoản"
            placeholder="NGUYEN VAN A"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
        />
        <Input
          label="Số tài khoản"
          placeholder="0123456789"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />
        <Input
          label="Ngân hàng"
          placeholder="Vietcombank"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        />
        <Input
          label="Chi nhánh"
          placeholder="Hà Nội"
          value={bankBranch}
          onChange={(e) => setBankBranch(e.target.value)}
        />
        <Button
          className="w-full"
          variant="accent"
          disabled={
            !accountHolder || !accountNumber || !bankName || submitRefund.isPending
          }
          loading={submitRefund.isPending}
          onClick={() => submitRefund.mutate()}
        >
          <Building2 className="mr-2 h-4 w-4" /> Gửi yêu cầu hoàn tiền
        </Button>
      </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="container-page py-8">
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </main>
  );
}

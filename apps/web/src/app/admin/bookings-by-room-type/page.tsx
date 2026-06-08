"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationHeader } from "@/components/hotel/commercial";

function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const BAR_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a",
  "#0891b2", "#ca8a04", "#4f46e5", "#be123c", "#059669",
  "#0284c7", "#9333ea", "#e11d48", "#65a30d", "#0d9488",
];

type RoomTypeData = { roomType: string; count: number };

export default function BookingsByRoomTypePage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());

  const q = useQuery({
    queryKey: ["bookings-by-room-type", from, to],
    queryFn: () =>
      api
        .get<RoomTypeData[]>("/reports/bookings-by-room-type", {
          params: { from, to },
        })
        .then((r) => r.data),
  });

  const data = q.data ?? [];
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      <OperationHeader
        kicker="Reports"
        title="Đơn hàng theo loại phòng"
        description="Biểu đồ cột hiển thị số lượng đơn đặt phòng phân bổ theo từng loại phòng trong khoảng thời gian được chọn."
        actions={
          <div className="toolbar-panel grid grid-cols-2 gap-3 sm:w-[320px]">
            <label className="text-sm font-medium text-slate-700">
              Từ ngày
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Đến ngày
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Biểu đồ đơn hàng theo loại phòng</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {total} đơn đặt phòng trong khoảng {from} — {to}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {q.isLoading ? (
              <Skeleton className="h-[400px] w-full rounded-xl" />
            ) : data.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data}
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="roomType"
                      tick={{ fontSize: 13, fill: "#475569" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 13, fill: "#475569" }}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} đơn`, "Số đơn"]}
                      labelFormatter={(label: string) => `Loại phòng: ${label}`}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={80}
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={entry.roomType}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="py-2 text-xs font-semibold uppercase text-slate-500">
                          Loại phòng
                        </th>
                        <th className="py-2 text-right text-xs font-semibold uppercase text-slate-500">
                          Số đơn
                        </th>
                        <th className="py-2 text-right text-xs font-semibold uppercase text-slate-500">
                          Tỷ lệ
                        </th>
                        <th className="py-2 pl-4 text-xs font-semibold uppercase text-slate-500">
                          Phân bổ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => {
                        const pct =
                          total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
                        return (
                          <tr
                            key={item.roomType}
                            className="border-b border-slate-100"
                          >
                            <td className="py-2.5 font-medium text-slate-800">
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor:
                                      BAR_COLORS[idx % BAR_COLORS.length],
                                  }}
                                />
                                {item.roomType}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-semibold text-slate-800">
                              {item.count}
                            </td>
                            <td className="py-2.5 text-right text-slate-500">
                              {pct}%
                            </td>
                            <td className="py-2.5 pl-4">
                              <div className="h-2 w-full max-w-[200px] rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      BAR_COLORS[idx % BAR_COLORS.length],
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  Chưa có dữ liệu
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Không có đơn đặt phòng nào trong khoảng thời gian đã chọn
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  Search,
  BedDouble,
  Maximize2,
  Wifi,
  Coffee,
  AlertCircle,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RoomType, HotelBranch } from "@/lib/types";

interface SearchItem {
  room: {
    id: string;
    roomNumber: string;
    floor: number;
  };
  roomType: RoomType;
  branch: HotelBranch;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
}

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const AMENITIES_OPTIONS = [
  "WiFi",
  "TV",
  "Điều hòa",
  "Tủ lạnh",
  "Bàn làm việc",
  "Bồn tắm",
  "Jacuzzi",
  "Minibar",
  "Butler service",
  "Phòng khách riêng",
];

export default function RoomsSearchPage() {
  return (
    <Suspense fallback={null}>
      <RoomsSearchInner />
    </Suspense>
  );
}

function RoomsSearchInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState(sp.get("checkIn") ?? todayISO(1));
  const [checkOut, setCheckOut] = useState(sp.get("checkOut") ?? todayISO(2));
  const [guests, setGuests] = useState(Number(sp.get("guests") ?? 2));
  const [province, setProvince] = useState(sp.get("province") ?? "");

  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [starRating, setStarRating] = useState<number | undefined>(undefined);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const i = sp.get("checkIn");
    const o = sp.get("checkOut");
    const g = sp.get("guests");
    const p = sp.get("province");
    if (i) setCheckIn(i);
    if (o) setCheckOut(o);
    if (g) setGuests(Number(g));
    if (p) setProvince(p);
  }, [sp]);

  const provincesQ = useQuery({
    queryKey: ["provinces"],
    queryFn: () => api.get<string[]>("/search/provinces").then((r) => r.data),
  });

  const queryKey = [
    "search",
    checkIn,
    checkOut,
    guests,
    province,
    minPrice,
    maxPrice,
    starRating,
    selectedAmenities.join(","),
    sortBy,
  ];

  const infiniteQ = useInfiniteQuery({
    queryKey,
    enabled: Boolean(checkIn && checkOut && guests > 0),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api
        .get<{
          data: SearchItem[];
          total: number;
          page: number;
          limit: number;
        }>("/search", {
          params: {
            checkIn,
            checkOut,
            guests,
            page: pageParam,
            limit: 50,
            ...(province ? { province } : {}),
            ...(minPrice ? { minPrice } : {}),
            ...(maxPrice ? { maxPrice } : {}),
            ...(starRating ? { starRating } : {}),
            ...(selectedAmenities.length
              ? { amenities: selectedAmenities.join(",") }
              : {}),
            ...(sortBy ? { sortBy } : {}),
          },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
  });

  const allItems = useMemo(
    () => infiniteQ.data?.pages.flatMap((p) => p.data) ?? [],
    [infiniteQ.data],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    if (province) qs.set("province", province);
    router.push(`/rooms?${qs.toString()}`);
  };

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Tìm phòng phù hợp với bạn
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Lựa chọn ngày, số khách và khu vực để xem các phòng còn trống
      </p>

      <form
        onSubmit={submit}
        className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-5"
      >
        <Input
          label="Nhận phòng"
          type="date"
          min={todayISO()}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          leftIcon={<CalendarDays className="h-4 w-4" />}
        />
        <Input
          label="Trả phòng"
          type="date"
          min={checkIn}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          leftIcon={<CalendarDays className="h-4 w-4" />}
        />
        <Input
          label="Số khách"
          type="number"
          min={1}
          max={10}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          leftIcon={<Users className="h-4 w-4" />}
        />
        <Select
          label="Khu vực"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">Toàn quốc</option>
          {provincesQ.data?.map((p: string) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={infiniteQ.isFetching}
          >
            <Search className="h-4 w-4" /> Tìm kiếm
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Bộ lọc
          {selectedAmenities.length > 0 ||
          starRating ||
          minPrice ||
          maxPrice ? (
            <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">
              {selectedAmenities.length +
                (starRating ? 1 : 0) +
                (minPrice || maxPrice ? 1 : 0)}
            </span>
          ) : null}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-500">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500"
          >
            <option value="">Mặc định</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="rating_desc">Đánh giá cao</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Bộ lọc</p>
            <button
              onClick={() => setShowFilters(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Khoảng giá</p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <Input
                  type="number"
                  placeholder="Đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Số sao</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setStarRating((prev) => (prev === s ? undefined : s))
                    }
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm ${
                      starRating === s
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" /> {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-slate-700">Tiện nghi</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {AMENITIES_OPTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm ${
                      selectedAmenities.includes(a)
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        {infiniteQ.isLoading && <ResultsSkeleton />}
        {infiniteQ.error && (
          <EmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="Không thể tải kết quả"
            description={getApiErrorMessage(infiniteQ.error)}
          />
        )}
        {infiniteQ.data && allItems.length === 0 && (
          <EmptyState
            icon={<BedDouble className="h-5 w-5" />}
            title="Không tìm thấy phòng phù hợp"
            description="Hãy thử thay đổi ngày, số khách hoặc bộ lọc."
          />
        )}
        {allItems.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Tìm thấy{" "}
              <span className="font-semibold">
                {infiniteQ.data?.pages[0]?.total ?? allItems.length}
              </span>{" "}
              phòng phù hợp
            </p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {allItems.map((item) => (
                <RoomCard
                  key={item.room.id}
                  item={item}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />
              ))}
            </div>
            {infiniteQ.hasNextPage && (
              <div className="mt-8 text-center">
                <Button
                  loading={infiniteQ.isFetchingNextPage}
                  onClick={() => infiniteQ.fetchNextPage()}
                  variant="outline"
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function RoomCard({
  item,
  checkIn,
  checkOut,
  guests,
}: {
  item: SearchItem;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const router = useRouter();
  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&auto=format&fit=crop&q=80",
  ];
  const img =
    (item.roomType.images && item.roomType.images[0]) ||
    FALLBACK_IMAGES[item.roomType.name.length % FALLBACK_IMAGES.length];

  const goDetail = () => {
    router.push(`/rooms/${item.roomType.id}`);
  };

  const goBook = () => {
    const qs = new URLSearchParams({
      roomTypeId: item.roomType.id,
      roomId: item.room.id,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/booking?${qs.toString()}`);
  };

  const branchName = item.branch.name;
  const stars = item.roomType.starRating ?? 3;

  return (
    <Card className="cursor-pointer overflow-hidden" onClick={goDetail}>
      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
        <img
          src={img}
          alt={item.roomType.name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-700 shadow ring-1 ring-emerald-200">
          {item.room.roomNumber}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-amber-600">
          <Star className="h-3 w-3 fill-current" /> {stars}.0
        </div>
      </div>
      <CardContent className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {item.roomType.name} · {item.room.roomNumber}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {item.roomType.description ?? "Phòng đầy đủ tiện nghi."}
          </p>
          {branchName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3" /> {branchName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" /> Tối đa{" "}
            {item.roomType.maxGuests} khách
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="h-4 w-4 text-slate-400" />{" "}
            {item.roomType.areaSqm} m²
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-slate-400" />{" "}
            {item.roomType.bedType}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wifi className="h-4 w-4 text-slate-400" /> Wifi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Coffee className="h-4 w-4 text-slate-400" /> Mini-bar
          </span>
        </div>

        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-xs text-slate-500">
              {item.nights} đêm · Tổng cộng
            </p>
            <p className="text-2xl font-bold text-brand-700">
              {formatCurrency(item.totalPrice)}
            </p>
            <p className="text-xs text-slate-500">
              {formatCurrency(item.pricePerNight)} / đêm
            </p>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              goBook();
            }}
          >
            Đặt phòng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <Skeleton className="h-56 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

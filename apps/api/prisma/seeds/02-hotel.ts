import { PrismaClient, PricingType, RoomStatus, type HotelBranch, type RoomType, type Room, type PricingRule } from "@prisma/client";

const standardImages = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
];

const deluxeImages = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1595576508898-0ac5e0228a28?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80",
];

const suiteImages = [
  "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
];

interface HotelResult {
  branches: HotelBranch[];
  roomTypes: { standard: RoomType; deluxe: RoomType; suite: RoomType };
  rooms: Room[];
}

function getStatus(floor: number, num: number): RoomStatus {
  if (num === 1) return RoomStatus.OCCUPIED;
  if (num === 2) return RoomStatus.DIRTY;
  if (num === 3) return RoomStatus.CLEANING;
  if (num === 4) return RoomStatus.MAINTENANCE;
  if (num === 5) return RoomStatus.RESERVED;
  return RoomStatus.AVAILABLE;
}

function generateRooms(
  prefix: string,
  branchId: string,
  standardTypeId: string,
  deluxeTypeId: string,
  suiteTypeId: string,
): { roomNumber: string; floor: number; roomTypeId: string; branchId: string; status: RoomStatus }[] {
  const rooms: { roomNumber: string; floor: number; roomTypeId: string; branchId: string; status: RoomStatus }[] = [];

  for (let floor = 1; floor <= 4; floor++) {
    for (let num = 1; num <= 5; num++) {
      rooms.push({ roomNumber: `${prefix}-${floor}${num.toString().padStart(2, "0")}`, floor, roomTypeId: standardTypeId, branchId, status: getStatus(floor, num) });
    }
  }

  for (let floor = 5; floor <= 8; floor++) {
    for (let num = 1; num <= 5; num++) {
      rooms.push({ roomNumber: `${prefix}-${floor}${num.toString().padStart(2, "0")}`, floor, roomTypeId: deluxeTypeId, branchId, status: getStatus(floor, num) });
    }
  }

  for (let floor = 9; floor <= 10; floor++) {
    for (let num = 1; num <= 5; num++) {
      rooms.push({ roomNumber: `${prefix}-${floor}${num.toString().padStart(2, "0")}`, floor, roomTypeId: suiteTypeId, branchId, status: getStatus(floor, num) });
    }
  }

  return rooms;
}

export async function seedHotel(prisma: PrismaClient): Promise<HotelResult> {
  const branchConfigs = [
    { id: "branch-hn", name: "Sapphire Stay Hà Nội", province: "Hà Nội", city: "Hà Nội", address: "123 Phố Huế, Hai Bà Trưng", phone: "0241234567" },
    { id: "branch-hcm", name: "Sapphire Stay TP.HCM", province: "TP. Hồ Chí Minh", city: "TP. Hồ Chí Minh", address: "456 Nguyễn Huệ, Quận 1", phone: "0281234567" },
    { id: "branch-dn", name: "Sapphire Stay Đà Nẵng", province: "Đà Nẵng", city: "Đà Nẵng", address: "789 Võ Nguyên Giáp, Sơn Trà", phone: "02361234567" },
    { id: "branch-nt", name: "Sapphire Stay Nha Trang", province: "Khánh Hòa", city: "Nha Trang", address: "15 Trần Phú, Lộc Thọ", phone: "02581234567" },
    { id: "branch-dl", name: "Sapphire Stay Đà Lạt", province: "Lâm Đồng", city: "Đà Lạt", address: "42 Trần Hưng Đạo, Phường 1", phone: "02631234567" },
    { id: "branch-pq", name: "Sapphire Stay Phú Quốc", province: "Kiên Giang", city: "Phú Quốc", address: "88 Trần Hưng Đạo, Dương Đông", phone: "02971234567" },
  ];

  const branches: HotelBranch[] = [];
  for (const bc of branchConfigs) {
    const branch = await prisma.hotelBranch.upsert({
      where: { id: bc.id },
      update: {},
      create: bc,
    });
    branches.push(branch);
  }

  const policies = {
    checkInTime: "14:00",
    checkOutTime: "12:00",
    requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
    generalInstructions: "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng.",
  };
  const faqsStandard = [{ question: "Có cho phép mang thú cưng?", answer: "Không, khách sạn không cho phép mang thú cưng." }, { question: "Có bữa sáng miễn phí?", answer: "Bữa sáng không bao gồm trong giá phòng." }];
  const faqsSuite = [{ question: "Có cho phép mang thú cưng?", answer: "Không, khách sạn không cho phép mang thú cưng." }, { question: "Có bữa sáng miễn phí?", answer: "Bữa sáng buffet 5 sao miễn phí cho khách Suite." }];

  const standardType = await prisma.roomType.upsert({
    where: { id: "roomtype-standard" },
    update: { starRating: 3, images: standardImages, policies: JSON.stringify(policies), popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi"], distanceToCenter: "2.5 km", nearbyPoints: ["Chợ đêm", "Hồ Gươm", "Nhà hát lớn"], faqs: JSON.stringify(faqsStandard), totalRooms: 60, numFloors: 10 },
    create: { id: "roomtype-standard", name: "Standard", description: "Phòng tiêu chuẩn thoải mái với đầy đủ tiện nghi cơ bản.", maxGuests: 2, areaSqm: 25, bedType: "Double", amenities: ["WiFi", "TV", "Điều hòa", "Tủ lạnh", "Bàn làm việc"], images: standardImages, starRating: 3, policies: JSON.stringify(policies), popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi"], distanceToCenter: "2.5 km", nearbyPoints: ["Chợ đêm", "Hồ Gươm", "Nhà hát lớn"], faqs: JSON.stringify(faqsStandard), totalRooms: 60, numFloors: 10 },
  });

  const deluxeType = await prisma.roomType.upsert({
    where: { id: "roomtype-deluxe" },
    update: { starRating: 4, images: deluxeImages, policies: JSON.stringify(policies), popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi", "Hồ bơi", "Spa"], distanceToCenter: "1.2 km", nearbyPoints: ["Phố đi bộ Nguyễn Huệ", "Chợ Bến Thành", "Nhà thờ Đức Bà"], faqs: JSON.stringify(faqsStandard), totalRooms: 60, numFloors: 10 },
    create: { id: "roomtype-deluxe", name: "Deluxe", description: "Phòng Deluxe sang trọng với view đẹp và tiện nghi cao cấp.", maxGuests: 3, areaSqm: 35, bedType: "King", amenities: ["WiFi", 'TV 55"', "Điều hòa", "Tủ lạnh Minibar", "Bàn làm việc", "Bồn tắm"], images: deluxeImages, starRating: 4, policies: JSON.stringify(policies), popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi", "Hồ bơi", "Spa"], distanceToCenter: "1.2 km", nearbyPoints: ["Phố đi bộ Nguyễn Huệ", "Chợ Bến Thành", "Nhà thờ Đức Bà"], faqs: JSON.stringify(faqsStandard), totalRooms: 60, numFloors: 10 },
  });

  const suitePolicies = { ...policies, generalInstructions: "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng. Butler sẽ hỗ trợ bạn." };
  const suiteType = await prisma.roomType.upsert({
    where: { id: "roomtype-suite" },
    update: { starRating: 5, images: suiteImages, policies: JSON.stringify(suitePolicies), popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi", "Hồ bơi vô cực", "Spa", "Nhà hàng 5 sao"], distanceToCenter: "915 m", nearbyPoints: ["Cầu Rồng", "Bãi biển Mỹ Khê", "Chùa Linh Ứng"], faqs: JSON.stringify(faqsSuite), totalRooms: 30, numFloors: 10 },
    create: { id: "roomtype-suite", name: "Suite", description: "Phòng Suite cao cấp với phòng khách riêng và toàn bộ tiện nghi hạng nhất.", maxGuests: 4, areaSqm: 60, bedType: "King + Sofa Bed", amenities: ["WiFi", 'TV 65"', "Điều hòa 2 chiều", "Minibar", "Phòng khách riêng", "Jacuzzi", "Butler service"], images: suiteImages, starRating: 5, policies: JSON.stringify(suitePolicies), popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi", "Hồ bơi vô cực", "Spa", "Nhà hàng 5 sao"], distanceToCenter: "915 m", nearbyPoints: ["Cầu Rồng", "Bãi biển Mỹ Khê", "Chùa Linh Ứng"], faqs: JSON.stringify(faqsSuite), totalRooms: 30, numFloors: 10 },
  });

  const roomTypes = { standard: standardType, deluxe: deluxeType, suite: suiteType };

  await prisma.pricingRule.createMany({
    skipDuplicates: true,
    data: [
      { roomTypeId: standardType.id, type: PricingType.DEFAULT, pricePerNight: 800000, priority: 0 },
      { roomTypeId: standardType.id, type: PricingType.SEASONAL, pricePerNight: 1000000, startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31"), priority: 1 },
      { roomTypeId: standardType.id, type: PricingType.HOLIDAY, pricePerNight: 1200000, startDate: new Date("2026-12-25"), endDate: new Date("2026-12-31"), priority: 2 },
      { roomTypeId: deluxeType.id, type: PricingType.DEFAULT, pricePerNight: 1500000, priority: 0 },
      { roomTypeId: deluxeType.id, type: PricingType.SEASONAL, pricePerNight: 1800000, startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31"), priority: 1 },
      { roomTypeId: deluxeType.id, type: PricingType.HOLIDAY, pricePerNight: 2200000, startDate: new Date("2026-12-25"), endDate: new Date("2026-12-31"), priority: 2 },
      { roomTypeId: suiteType.id, type: PricingType.DEFAULT, pricePerNight: 3000000, priority: 0 },
      { roomTypeId: suiteType.id, type: PricingType.SEASONAL, pricePerNight: 3500000, startDate: new Date("2026-06-01"), endDate: new Date("2026-08-31"), priority: 1 },
      { roomTypeId: suiteType.id, type: PricingType.HOLIDAY, pricePerNight: 4500000, startDate: new Date("2026-12-25"), endDate: new Date("2026-12-31"), priority: 2 },
    ],
  });

  // Upsert rooms by roomNumber (safe, no data loss)
  const allRoomData = [
    ...generateRooms("HN", branches[0].id, standardType.id, deluxeType.id, suiteType.id),
    ...generateRooms("HCM", branches[1].id, standardType.id, deluxeType.id, suiteType.id),
    ...generateRooms("DN", branches[2].id, standardType.id, deluxeType.id, suiteType.id),
    ...generateRooms("NT", branches[3].id, standardType.id, deluxeType.id, suiteType.id),
    ...generateRooms("DL", branches[4].id, standardType.id, deluxeType.id, suiteType.id),
    ...generateRooms("PQ", branches[5].id, standardType.id, deluxeType.id, suiteType.id),
  ];

  const rooms: Room[] = [];
  for (const r of allRoomData) {
    const room = await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: { floor: r.floor, roomTypeId: r.roomTypeId, branchId: r.branchId, status: r.status },
      create: r,
    });
    rooms.push(room);
  }

  const statusCounts = rooms.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  console.log(`Seeded: ${branches.length} branches, ${rooms.length} rooms (statuses: ${JSON.stringify(statusCounts)}), 9 pricing rules`);
  return { branches, roomTypes, rooms };
}

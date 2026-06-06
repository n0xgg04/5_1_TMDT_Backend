import {
  PrismaClient,
  Role,
  RoomStatus,
  PricingType,
  BookingStatus,
  PaymentStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

function generateRooms(
  prefix: string,
  branchId: string,
  standardTypeId: string,
  deluxeTypeId: string,
  suiteTypeId: string,
) {
  const rooms: {
    roomNumber: string;
    floor: number;
    roomTypeId: string;
    branchId: string;
    status: RoomStatus;
  }[] = [];

  for (let floor = 1; floor <= 4; floor++) {
    for (let num = 1; num <= 5; num++) {
      rooms.push({
        roomNumber: `${prefix}-${floor}${num.toString().padStart(2, "0")}`,
        floor,
        roomTypeId: standardTypeId,
        branchId,
        status: RoomStatus.AVAILABLE,
      });
    }
  }

  for (let floor = 5; floor <= 8; floor++) {
    for (let num = 1; num <= 5; num++) {
      rooms.push({
        roomNumber: `${prefix}-${floor}${num.toString().padStart(2, "0")}`,
        floor,
        roomTypeId: deluxeTypeId,
        branchId,
        status: RoomStatus.AVAILABLE,
      });
    }
  }

  for (let floor = 9; floor <= 10; floor++) {
    for (let num = 1; num <= 5; num++) {
      rooms.push({
        roomNumber: `${prefix}-${floor}${num.toString().padStart(2, "0")}`,
        floor,
        roomTypeId: suiteTypeId,
        branchId,
        status: RoomStatus.AVAILABLE,
      });
    }
  }

  return rooms;
}

async function main() {
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const customerHash = await bcrypt.hash("Customer@123", 12);
  const receptionistHash = await bcrypt.hash("Staff@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@hotel.com" },
    update: {},
    create: {
      email: "admin@hotel.com",
      passwordHash: adminHash,
      firstName: "System",
      lastName: "Admin",
      role: Role.ADMIN,
      phone: "0900000000",
    },
  });

  const customers = [
    {
      email: "customer1@hotel.com",
      firstName: "Nguyen",
      lastName: "Van A",
      phone: "0911111111",
    },
    {
      email: "customer2@hotel.com",
      firstName: "Tran",
      lastName: "Thi B",
      phone: "0922222222",
    },
    {
      email: "customer3@hotel.com",
      firstName: "Le",
      lastName: "Van C",
      phone: "0933333333",
    },
  ];

  for (const c of customers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        ...c,
        passwordHash: customerHash,
        role: Role.CUSTOMER,
      },
    });
  }

  const receptionists = [
    {
      email: "receptionist1@hotel.com",
      firstName: "Pham",
      lastName: "Thi D",
      phone: "0944444444",
    },
    {
      email: "receptionist2@hotel.com",
      firstName: "Hoang",
      lastName: "Van E",
      phone: "0955555555",
    },
  ];

  for (const r of receptionists) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        ...r,
        passwordHash: receptionistHash,
        role: Role.RECEPTIONIST,
      },
    });
  }

  const standardType = await prisma.roomType.upsert({
    where: { id: "roomtype-standard" },
    update: {
      starRating: 3,
      images: standardImages,
      policies: JSON.stringify({
        checkInTime: "14:00",
        checkOutTime: "12:00",
        requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
        generalInstructions:
          "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng.",
      }),
      popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi"],
      distanceToCenter: "2.5 km",
      nearbyPoints: ["Chợ đêm", "Hồ Gươm", "Nhà hát lớn"],
      faqs: JSON.stringify([
        {
          question: "Có cho phép mang thú cưng?",
          answer: "Không, khách sạn không cho phép mang thú cưng.",
        },
        {
          question: "Có bữa sáng miễn phí?",
          answer: "Bữa sáng không bao gồm trong giá phòng.",
        },
      ]),
      totalRooms: 60,
      numFloors: 10,
    },
    create: {
      id: "roomtype-standard",
      name: "Standard",
      description: "Phòng tiêu chuẩn thoải mái với đầy đủ tiện nghi cơ bản.",
      maxGuests: 2,
      areaSqm: 25,
      bedType: "Double",
      amenities: ["WiFi", "TV", "Điều hòa", "Tủ lạnh", "Bàn làm việc"],
      images: standardImages,
      starRating: 3,
      policies: JSON.stringify({
        checkInTime: "14:00",
        checkOutTime: "12:00",
        requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
        generalInstructions:
          "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng.",
      }),
      popularFacilities: ["Lễ tân 24h", "Bãi đỗ xe", "Thang máy", "WiFi"],
      distanceToCenter: "2.5 km",
      nearbyPoints: ["Chợ đêm", "Hồ Gươm", "Nhà hát lớn"],
      faqs: JSON.stringify([
        {
          question: "Có cho phép mang thú cưng?",
          answer: "Không, khách sạn không cho phép mang thú cưng.",
        },
        {
          question: "Có bữa sáng miễn phí?",
          answer: "Bữa sáng không bao gồm trong giá phòng.",
        },
      ]),
      totalRooms: 60,
      numFloors: 10,
    },
  });

  const deluxeType = await prisma.roomType.upsert({
    where: { id: "roomtype-deluxe" },
    update: {
      starRating: 4,
      images: deluxeImages,
      policies: JSON.stringify({
        checkInTime: "14:00",
        checkOutTime: "12:00",
        requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
        generalInstructions:
          "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng.",
      }),
      popularFacilities: [
        "Lễ tân 24h",
        "Bãi đỗ xe",
        "Thang máy",
        "WiFi",
        "Hồ bơi",
        "Spa",
      ],
      distanceToCenter: "1.2 km",
      nearbyPoints: ["Phố đi bộ Nguyễn Huệ", "Chợ Bến Thành", "Nhà thờ Đức Bà"],
      faqs: JSON.stringify([
        {
          question: "Có cho phép mang thú cưng?",
          answer: "Không, khách sạn không cho phép mang thú cưng.",
        },
        {
          question: "Có bữa sáng miễn phí?",
          answer: "Bữa sáng không bao gồm trong giá phòng.",
        },
      ]),
      totalRooms: 60,
      numFloors: 10,
    },
    create: {
      id: "roomtype-deluxe",
      name: "Deluxe",
      description: "Phòng Deluxe sang trọng với view đẹp và tiện nghi cao cấp.",
      maxGuests: 3,
      areaSqm: 35,
      bedType: "King",
      amenities: [
        "WiFi",
        'TV 55"',
        "Điều hòa",
        "Tủ lạnh Minibar",
        "Bàn làm việc",
        "Bồn tắm",
      ],
      images: deluxeImages,
      starRating: 4,
      policies: JSON.stringify({
        checkInTime: "14:00",
        checkOutTime: "12:00",
        requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
        generalInstructions:
          "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng.",
      }),
      popularFacilities: [
        "Lễ tân 24h",
        "Bãi đỗ xe",
        "Thang máy",
        "WiFi",
        "Hồ bơi",
        "Spa",
      ],
      distanceToCenter: "1.2 km",
      nearbyPoints: ["Phố đi bộ Nguyễn Huệ", "Chợ Bến Thành", "Nhà thờ Đức Bà"],
      faqs: JSON.stringify([
        {
          question: "Có cho phép mang thú cưng?",
          answer: "Không, khách sạn không cho phép mang thú cưng.",
        },
        {
          question: "Có bữa sáng miễn phí?",
          answer: "Bữa sáng không bao gồm trong giá phòng.",
        },
      ]),
      totalRooms: 60,
      numFloors: 10,
    },
  });

  const suiteType = await prisma.roomType.upsert({
    where: { id: "roomtype-suite" },
    update: {
      starRating: 5,
      images: suiteImages,
      policies: JSON.stringify({
        checkInTime: "14:00",
        checkOutTime: "12:00",
        requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
        generalInstructions:
          "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng. Butler sẽ hỗ trợ bạn.",
      }),
      popularFacilities: [
        "Lễ tân 24h",
        "Bãi đỗ xe",
        "Thang máy",
        "WiFi",
        "Hồ bơi vô cực",
        "Spa",
        "Nhà hàng 5 sao",
      ],
      distanceToCenter: "915 m",
      nearbyPoints: ["Cầu Rồng", "Bãi biển Mỹ Khê", "Chùa Linh Ứng"],
      faqs: JSON.stringify([
        {
          question: "Có cho phép mang thú cưng?",
          answer: "Không, khách sạn không cho phép mang thú cưng.",
        },
        {
          question: "Có bữa sáng miễn phí?",
          answer: "Bữa sáng buffet 5 sao miễn phí cho khách Suite.",
        },
      ]),
      totalRooms: 30,
      numFloors: 10,
    },
    create: {
      id: "roomtype-suite",
      name: "Suite",
      description:
        "Phòng Suite cao cấp với phòng khách riêng và toàn bộ tiện nghi hạng nhất.",
      maxGuests: 4,
      areaSqm: 60,
      bedType: "King + Sofa Bed",
      amenities: [
        "WiFi",
        'TV 65"',
        "Điều hòa 2 chiều",
        "Minibar",
        "Phòng khách riêng",
        "Jacuzzi",
        "Butler service",
      ],
      images: suiteImages,
      starRating: 5,
      policies: JSON.stringify({
        checkInTime: "14:00",
        checkOutTime: "12:00",
        requiredDocuments: "CMND/CCCD hoặc hộ chiếu (bản mềm được chấp nhận)",
        generalInstructions:
          "Vui lòng mang theo giấy tờ tùy thân khi nhận phòng. Butler sẽ hỗ trợ bạn.",
      }),
      popularFacilities: [
        "Lễ tân 24h",
        "Bãi đỗ xe",
        "Thang máy",
        "WiFi",
        "Hồ bơi vô cực",
        "Spa",
        "Nhà hàng 5 sao",
      ],
      distanceToCenter: "915 m",
      nearbyPoints: ["Cầu Rồng", "Bãi biển Mỹ Khê", "Chùa Linh Ứng"],
      faqs: JSON.stringify([
        {
          question: "Có cho phép mang thú cưng?",
          answer: "Không, khách sạn không cho phép mang thú cưng.",
        },
        {
          question: "Có bữa sáng miễn phí?",
          answer: "Bữa sáng buffet 5 sao miễn phí cho khách Suite.",
        },
      ]),
      totalRooms: 30,
      numFloors: 10,
    },
  });

  await prisma.pricingRule.createMany({
    skipDuplicates: true,
    data: [
      {
        roomTypeId: standardType.id,
        type: PricingType.DEFAULT,
        pricePerNight: 800000,
        priority: 0,
      },
      {
        roomTypeId: standardType.id,
        type: PricingType.SEASONAL,
        pricePerNight: 1000000,
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
        priority: 1,
      },
      {
        roomTypeId: standardType.id,
        type: PricingType.HOLIDAY,
        pricePerNight: 1200000,
        startDate: new Date("2026-12-25"),
        endDate: new Date("2026-12-31"),
        priority: 2,
      },
      {
        roomTypeId: deluxeType.id,
        type: PricingType.DEFAULT,
        pricePerNight: 1500000,
        priority: 0,
      },
      {
        roomTypeId: deluxeType.id,
        type: PricingType.SEASONAL,
        pricePerNight: 1800000,
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
        priority: 1,
      },
      {
        roomTypeId: deluxeType.id,
        type: PricingType.HOLIDAY,
        pricePerNight: 2200000,
        startDate: new Date("2026-12-25"),
        endDate: new Date("2026-12-31"),
        priority: 2,
      },
      {
        roomTypeId: suiteType.id,
        type: PricingType.DEFAULT,
        pricePerNight: 3000000,
        priority: 0,
      },
      {
        roomTypeId: suiteType.id,
        type: PricingType.SEASONAL,
        pricePerNight: 3500000,
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
        priority: 1,
      },
      {
        roomTypeId: suiteType.id,
        type: PricingType.HOLIDAY,
        pricePerNight: 4500000,
        startDate: new Date("2026-12-25"),
        endDate: new Date("2026-12-31"),
        priority: 2,
      },
    ],
  });

  const branchHN = await prisma.hotelBranch.upsert({
    where: { id: "branch-hn" },
    update: {},
    create: {
      id: "branch-hn",
      name: "Sapphire Stay Hà Nội",
      province: "Hà Nội",
      city: "Hà Nội",
      address: "123 Phố Huế, Hai Bà Trưng",
      phone: "0241234567",
    },
  });

  const branchHCM = await prisma.hotelBranch.upsert({
    where: { id: "branch-hcm" },
    update: {},
    create: {
      id: "branch-hcm",
      name: "Sapphire Stay TP.HCM",
      province: "TP. Hồ Chí Minh",
      city: "TP. Hồ Chí Minh",
      address: "456 Nguyễn Huệ, Quận 1",
      phone: "0281234567",
    },
  });

  const branchDN = await prisma.hotelBranch.upsert({
    where: { id: "branch-dn" },
    update: {},
    create: {
      id: "branch-dn",
      name: "Sapphire Stay Đà Nẵng",
      province: "Đà Nẵng",
      city: "Đà Nẵng",
      address: "789 Võ Nguyên Giáp, Sơn Trà",
      phone: "02361234567",
    },
  });

  await prisma.bookingAddon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingAttachment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();

  const allRooms = [
    ...generateRooms(
      "HN",
      branchHN.id,
      standardType.id,
      deluxeType.id,
      suiteType.id,
    ),
    ...generateRooms(
      "HCM",
      branchHCM.id,
      standardType.id,
      deluxeType.id,
      suiteType.id,
    ),
    ...generateRooms(
      "DN",
      branchDN.id,
      standardType.id,
      deluxeType.id,
      suiteType.id,
    ),
  ];

  for (const room of allRooms) {
    await prisma.room.create({ data: room });
  }

  const seededRooms = await prisma.room.findMany({
    include: { roomType: true },
  });
  const seededCustomers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
  });

  const reviewData = [
    {
      rating: 5,
      comment:
        "Phòng rất sạch sẽ, nhân viên thân thiện và nhiệt tình. Sẽ quay lại!",
    },
    {
      rating: 5,
      comment: "View đẹp, giá hợp lý. Bữa sáng ngon, vị trí thuận tiện.",
    },
    {
      rating: 4,
      comment:
        "Phòng ổn, tiện nghi đầy đủ. Chỉ hơi tiếc là wifi hơi chậm vào buổi tối.",
    },
    {
      rating: 4,
      comment: "Tổng thể tốt, nhân viên lễ tân nhiệt tình. Giá cả phải chăng.",
    },
    {
      rating: 3,
      comment:
        "Phòng khá ổn nhưng hơi ồn do gần đường lớn. Cần cải thiện cách âm.",
    },
    {
      rating: 3,
      comment:
        "Tạm được, không gian hơi chật so với giá. Vệ sinh cần chú ý hơn.",
    },
    {
      rating: 2,
      comment: "Điều hòa bị hỏng, phải đổi phòng giữa đêm. Khá mệt mỏi.",
    },
    {
      rating: 5,
      comment:
        "Tuyệt vờii! Phòng Suite rộng rãi, jacuzzi hoạt động tốt. Butler service chu đáo.",
    },
    {
      rating: 4,
      comment:
        "Vị trí đắc địa, gần trung tâm. Phòng Standard nhưng đầy đủ tiện nghi.",
    },
    {
      rating: 5,
      comment: "Kỳ nghỉ tuyệt vờii! Gia đình tôi rất hài lòng với dịch vụ.",
    },
    {
      rating: 2,
      comment:
        "Nhân viên không nhiệt tình, check-in chậm. Phòng không giống hình.",
    },
    {
      rating: 4,
      comment:
        "Khách sạn mới, sạch sẽ. Bãi đỗ xe rộng rãi, thuận tiện cho gia đình.",
    },
    {
      rating: 3,
      comment: "Giá hơi cao so với chất lượng. Bữa sáng ít món, không đa dạng.",
    },
    {
      rating: 5,
      comment: "Deluxe room view đẹp, giường King rất thoải mái. Ngủ ngon!",
    },
    {
      rating: 4,
      comment:
        "Thang máy hơi chậm nhưng phòng rất ổn. Cảm ơn đội ngũ dọn phòng.",
    },
    {
      rating: 1,
      comment: "Thất vọng! Phòng bẩn, khăn tắm có mùi. Không bao giờ quay lại.",
    },
    {
      rating: 5,
      comment: "Trên cả tuyệt vờii! Mọi thứ đều hoàn hảo từ A đến Z.",
    },
    {
      rating: 4,
      comment: "Lần thứ 3 ở đây, vẫn luôn hài lòng. Giữ vững chất lượng nhé!",
    },
    {
      rating: 3,
      comment: "Phòng ok nhưng hành lang hơi tối. Cần bảo trì hệ thống đèn.",
    },
    {
      rating: 2,
      comment: "Máy lạnh kêu to suốt đêm. Đã phản ánh nhưng không được xử lý.",
    },
    {
      rating: 5,
      comment:
        "Minibar đầy đủ, giá hợp lý. Phòng ngủ yên tĩnh, không bị quấy rầy.",
    },
    {
      rating: 4,
      comment: "Check-out nhanh gọn. Nhân viên hỗ trợ gọi taxi rất nhiệt tình.",
    },
    { rating: 3, comment: "Hồ bơi nhỏ hơn mong đợi nhưng sạch. Spa khá ổn." },
    {
      rating: 5,
      comment:
        "Butler service xuất sắc! Mọi yêu cầu đều được đáp ứng nhanh chóng.",
    },
    {
      rating: 4,
      comment: "Phòng có ban công riêng, ngắm cảnh buổi sáng rất chill.",
    },
    {
      rating: 2,
      comment: "Nước nóng yếu, tắm không thoải mái. Hy vọng khắc phục sớm.",
    },
    {
      rating: 5,
      comment: "Gia đình tôi rất thích! Trẻ con vui chơi thoải mái, an toàn.",
    },
    {
      rating: 4,
      comment: "Vị trí gần chợ đêm, đi bộ được. Rất tiện cho khách du lịch.",
    },
    {
      rating: 3,
      comment: "Tủ lạnh hơi nhỏ, không để được nhiều đồ. Còn lại ổn.",
    },
    {
      rating: 5,
      comment:
        "Phòng Suite xứng đáng từng đồng! Phòng khách riêng rất tiện lợi.",
    },
    {
      rating: 4,
      comment: "Giường đôi thoải mái, chăn ga sạch sẽ thơm tho. Ngủ rất ngon.",
    },
    {
      rating: 2,
      comment: "Nhân viên dọn phòng quên bổ sung nước uống 2 ngày liên tiếp.",
    },
    {
      rating: 5,
      comment:
        "Tuyệt vờii! Mọi thứ đều đúng như mô tả. Sẽ giới thiệu cho bạn bè.",
    },
    {
      rating: 4,
      comment: "Khách sạn yên tĩnh, phù hợp nghỉ dưỡng. Wifi ổn định.",
    },
    {
      rating: 3,
      comment: "Thang máy đôi khi bị kẹt, hơi sợ. Mong khách sạn sửa chữa.",
    },
    {
      rating: 5,
      comment:
        "Ấn tượng đầu tiên rất tốt! Lobby sang trọng, nhân viên chuyên nghiệp.",
    },
    {
      rating: 4,
      comment: "Phòng có bàn làm việc rộng, tiện cho dân công sở đi công tác.",
    },
    { rating: 2, comment: "Ồn ào từ quán bar gần đó. Cách âm kém, khó ngủ." },
    {
      rating: 5,
      comment: "Jacuzzi hoạt động tốt, nước nóng đủ. Thư giãn tuyệt vờii!",
    },
    {
      rating: 4,
      comment: "Gần biển, đi bộ 5 phút là tới. Rất thích hợp cho kỳ nghỉ hè.",
    },
    {
      rating: 3,
      comment: "Bãi đỗ xe hơi xa, phải đi bộ một đoạn. Phòng thì ổn.",
    },
    { rating: 5, comment: "Mọi thứ đều hoàn hảo! Không có gì để phàn nàn." },
  ];

  for (let i = 0; i < Math.min(45, seededRooms.length); i++) {
    const room = seededRooms[i];
    const customer = seededCustomers[i % seededCustomers.length];
    const rv = reviewData[i % reviewData.length];

    const checkIn = new Date(2026, 0, 1 + i);
    const checkOut = new Date(2026, 0, 2 + i);
    const paymentDeadline = new Date(checkIn);
    paymentDeadline.setHours(paymentDeadline.getHours() + 1);

    const basePrice =
      room.roomType.id === standardType.id
        ? 800000
        : room.roomType.id === deluxeType.id
          ? 1500000
          : 3000000;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        roomId: room.id,
        checkIn,
        checkOut,
        totalAmount: basePrice,
        status: BookingStatus.CHECKED_OUT,
        paymentDeadline,
        checkInActual: checkIn,
        checkOutActual: checkOut,
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        roomTypeId: room.roomTypeId,
        rating: rv.rating,
        comment: rv.comment,
        images: [],
      },
    });
  }

  await prisma.paymentMethodInfo.upsert({
    where: { id: "payment-method-1" },
    update: {},
    create: {
      id: "payment-method-1",
      bankName: "Vietcombank",
      accountNumber: "1234567890123",
      accountHolder: "Sapphire Stay Hotel",
      branch: "Hà Nội",
      isActive: true,
    },
  });

  await prisma.paymentMethodInfo.upsert({
    where: { id: "payment-method-2" },
    update: {},
    create: {
      id: "payment-method-2",
      bankName: "Techcombank",
      accountNumber: "9876543210987",
      accountHolder: "Sapphire Stay Hotel",
      branch: "TP. Hồ Chí Minh",
      isActive: true,
    },
  });

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextQuarter = new Date(now);
  nextQuarter.setMonth(nextQuarter.getMonth() + 3);

  const coupons = [
    {
      code: "SUMMER2026",
      type: "percentage",
      value: 15,
      minAmount: 1000000,
      maxDiscount: 300000,
      usageLimit: 100,
      startDate: now,
      endDate: nextQuarter,
    },
    {
      code: "WELCOME100",
      type: "fixed",
      value: 100000,
      minAmount: 500000,
      maxDiscount: null,
      usageLimit: 50,
      startDate: now,
      endDate: nextQuarter,
    },
    {
      code: "FLASH50",
      type: "percentage",
      value: 50,
      minAmount: 2000000,
      maxDiscount: 500000,
      usageLimit: 20,
      startDate: now,
      endDate: nextMonth,
    },
    {
      code: "WEEKEND20",
      type: "percentage",
      value: 20,
      minAmount: 1500000,
      maxDiscount: 400000,
      usageLimit: 200,
      startDate: now,
      endDate: nextQuarter,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        type: c.type,
        value: c.value,
        minAmount: c.minAmount,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: true,
      },
    });
  }

  const demoCustomers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
  });
  const demoRooms = await prisma.room.findMany({
    include: { roomType: true },
  });

  const checkedOutBookings = [
    {
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
      status: BookingStatus.CHECKED_OUT,
      price: 1600000,
      paid: true,
    },
    {
      checkIn: "2026-05-02",
      checkOut: "2026-05-04",
      status: BookingStatus.CHECKED_OUT,
      price: 3000000,
      paid: true,
    },
    {
      checkIn: "2026-05-03",
      checkOut: "2026-05-05",
      status: BookingStatus.CHECKED_OUT,
      price: 1500000,
      paid: true,
    },
    {
      checkIn: "2026-05-04",
      checkOut: "2026-05-06",
      status: BookingStatus.CHECKED_OUT,
      price: 3200000,
      paid: true,
    },
    {
      checkIn: "2026-05-05",
      checkOut: "2026-05-07",
      status: BookingStatus.CHECKED_OUT,
      price: 800000,
      paid: true,
    },
    {
      checkIn: "2026-05-06",
      checkOut: "2026-05-08",
      status: BookingStatus.CHECKED_OUT,
      price: 1800000,
      paid: true,
    },
    {
      checkIn: "2026-05-07",
      checkOut: "2026-05-09",
      status: BookingStatus.CHECKED_OUT,
      price: 4500000,
      paid: true,
    },
    {
      checkIn: "2026-05-08",
      checkOut: "2026-05-10",
      status: BookingStatus.CHECKED_OUT,
      price: 1600000,
      paid: true,
    },
    {
      checkIn: "2026-05-09",
      checkOut: "2026-05-11",
      status: BookingStatus.CHECKED_OUT,
      price: 3000000,
      paid: true,
    },
    {
      checkIn: "2026-05-10",
      checkOut: "2026-05-12",
      status: BookingStatus.CHECKED_OUT,
      price: 1500000,
      paid: true,
    },
    {
      checkIn: "2026-05-11",
      checkOut: "2026-05-13",
      status: BookingStatus.CHECKED_OUT,
      price: 3600000,
      paid: true,
    },
    {
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      status: BookingStatus.CHECKED_OUT,
      price: 800000,
      paid: true,
    },
    {
      checkIn: "2026-05-13",
      checkOut: "2026-05-15",
      status: BookingStatus.CHECKED_OUT,
      price: 2200000,
      paid: true,
    },
    {
      checkIn: "2026-05-14",
      checkOut: "2026-05-16",
      status: BookingStatus.CHECKED_OUT,
      price: 6000000,
      paid: true,
    },
    {
      checkIn: "2026-05-15",
      checkOut: "2026-05-17",
      status: BookingStatus.CHECKED_OUT,
      price: 1600000,
      paid: true,
    },
  ];

  const checkedInBookings = [
    {
      checkIn: "2026-05-15",
      checkOut: "2026-05-20",
      status: BookingStatus.CHECKED_IN,
      price: 4500000,
      paid: true,
    },
    {
      checkIn: "2026-05-16",
      checkOut: "2026-05-19",
      status: BookingStatus.CHECKED_IN,
      price: 3000000,
      paid: true,
    },
    {
      checkIn: "2026-05-17",
      checkOut: "2026-05-21",
      status: BookingStatus.CHECKED_IN,
      price: 1500000,
      paid: true,
    },
  ];

  const pendingApprovalBookings = [
    {
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
      status: BookingStatus.PENDING_APPROVAL,
      price: 1600000,
      paid: false,
    },
    {
      checkIn: "2026-05-02",
      checkOut: "2026-05-05",
      status: BookingStatus.PENDING_APPROVAL,
      price: 3000000,
      paid: false,
    },
    {
      checkIn: "2026-05-03",
      checkOut: "2026-05-06",
      status: BookingStatus.PENDING_APPROVAL,
      price: 800000,
      paid: false,
    },
    {
      checkIn: "2026-05-04",
      checkOut: "2026-05-07",
      status: BookingStatus.PENDING_APPROVAL,
      price: 4500000,
      paid: false,
    },
    {
      checkIn: "2026-05-05",
      checkOut: "2026-05-08",
      status: BookingStatus.PENDING_APPROVAL,
      price: 1500000,
      paid: false,
    },
    {
      checkIn: "2026-05-06",
      checkOut: "2026-05-09",
      status: BookingStatus.PENDING_APPROVAL,
      price: 2200000,
      paid: false,
    },
    {
      checkIn: "2026-05-07",
      checkOut: "2026-05-10",
      status: BookingStatus.PENDING_APPROVAL,
      price: 1800000,
      paid: false,
    },
    {
      checkIn: "2026-05-08",
      checkOut: "2026-05-11",
      status: BookingStatus.PENDING_APPROVAL,
      price: 3200000,
      paid: false,
    },
    {
      checkIn: "2026-05-09",
      checkOut: "2026-05-12",
      status: BookingStatus.PENDING_APPROVAL,
      price: 6000000,
      paid: false,
    },
    {
      checkIn: "2026-05-10",
      checkOut: "2026-05-13",
      status: BookingStatus.PENDING_APPROVAL,
      price: 1600000,
      paid: false,
    },
  ];

  const confirmedBookings = [
    {
      checkIn: "2026-05-18",
      checkOut: "2026-05-21",
      status: BookingStatus.CONFIRMED,
      price: 4500000,
      paid: false,
    },
    {
      checkIn: "2026-05-19",
      checkOut: "2026-05-24",
      status: BookingStatus.CONFIRMED,
      price: 1500000,
      paid: false,
    },
  ];

  const demoBookingsConfig = [
    ...checkedOutBookings,
    ...checkedInBookings,
    ...pendingApprovalBookings,
    ...confirmedBookings,
  ];

  for (let i = 0; i < demoBookingsConfig.length; i++) {
    const cfg = demoBookingsConfig[i];
    const customer = demoCustomers[i % demoCustomers.length];
    const room = demoRooms[i % demoRooms.length];

    const checkIn = new Date(cfg.checkIn);
    const checkOut = new Date(cfg.checkOut);
    const createdAt = new Date(checkIn);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 5) - 1);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        roomId: room.id,
        checkIn,
        checkOut,
        totalAmount: cfg.price,
        status: cfg.status,
        paymentDeadline: new Date(checkIn.getTime() + 15 * 60 * 1000),
        checkInActual:
          cfg.status === BookingStatus.CHECKED_OUT ||
          cfg.status === BookingStatus.CHECKED_IN
            ? checkIn
            : null,
        checkOutActual:
          cfg.status === BookingStatus.CHECKED_OUT ? checkOut : null,
        createdAt,
      },
    });

    if (cfg.paid) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          method: "VNPAY",
          paymentType: "FULL",
          amount: cfg.price,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        },
      });
    } else if (cfg.status === BookingStatus.PENDING_APPROVAL) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          method: "BANK_TRANSFER",
          paymentType: "FULL",
          amount: cfg.price,
          status: PaymentStatus.PENDING,
          receiptImageUrl:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop&q=80",
        },
      });
    }
  }

  console.log(
    `Seeded ${demoBookingsConfig.length} demo bookings with payments.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

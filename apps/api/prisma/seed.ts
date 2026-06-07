import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./seeds/01-users";
import { seedHotel } from "./seeds/02-hotel";
import { seedBookings } from "./seeds/03-bookings";
import { seedExtras } from "./seeds/04-extras";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Sapphire Stay Seed: Starting ===\n");

  console.log("--- Step 1: Users ---");
  const users = await seedUsers(prisma);

  console.log("\n--- Step 2: Hotel (Branches, Room Types, Rooms, Pricing) ---");
  const hotel = await seedHotel(prisma);

  console.log("\n--- Step 3: Bookings, Payments, Reviews, Addons, Attachments ---");
  const { bookingIds } = await seedBookings(
    prisma,
    users.customers,
    hotel.rooms,
    users.admins,
    hotel.roomTypes,
  );

  console.log("\n--- Step 4: Coupons, FlashSales, Wishlist, Conversations, Notifications, Bills, Transactions ---");
  await seedExtras(
    prisma,
    users.customers,
    users.receptionists,
    hotel.roomTypes,
    bookingIds,
  );

  console.log("\n=== Seed complete! ===");
  console.log("Test accounts:");
  console.log("  Admin:    admin@hotel.com / Admin@123");
  console.log("  Admin2:   admin2@hotel.com / Admin@123");
  console.log("  Customer: customer1@hotel.com / Customer@123");
  console.log("  Staff:    receptionist1@hotel.com / Staff@123");
  console.log("  HK:       housekeeping1@hotel.com / Staff@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

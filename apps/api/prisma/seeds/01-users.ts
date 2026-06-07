import { PrismaClient, Role, type User } from "@prisma/client";
import * as bcrypt from "bcryptjs";

interface UsersResult {
  admins: User[];
  customers: User[];
  receptionists: User[];
  housekeepings: User[];
}

export async function seedUsers(prisma: PrismaClient): Promise<UsersResult> {
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const customerHash = await bcrypt.hash("Customer@123", 12);
  const staffHash = await bcrypt.hash("Staff@123", 12);
  const housekeepingHash = await bcrypt.hash("Staff@123", 12);

  const adminData = [
    { email: "admin@hotel.com", firstName: "Lê", lastName: "Quản Trị", phone: "0900000000" },
    { email: "admin2@hotel.com", firstName: "Phạm", lastName: "Điều Hành", phone: "0900000001" },
    { email: "admin3@hotel.com", firstName: "Hoàng", lastName: "Giám Sát", phone: "0900000002" },
  ];

  const admins: User[] = [];
  for (const a of adminData) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { ...a, passwordHash: adminHash, role: Role.ADMIN },
    });
    admins.push(user);
  }

  const customerData = [
    { email: "customer1@hotel.com", firstName: "Nguyễn", lastName: "Văn A", phone: "0911111111" },
    { email: "customer2@hotel.com", firstName: "Trần", lastName: "Thị B", phone: "0922222222" },
    { email: "customer3@hotel.com", firstName: "Lê", lastName: "Văn C", phone: "0933333333" },
    { email: "customer4@hotel.com", firstName: "Vũ", lastName: "Đức D", phone: "0944444441" },
    { email: "customer5@hotel.com", firstName: "Đặng", lastName: "Thị E", phone: "0955555551" },
    { email: "customer6@hotel.com", firstName: "Bùi", lastName: "Văn F", phone: "0966666666" },
  ];

  const customers: User[] = [];
  for (const c of customerData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, passwordHash: customerHash, role: Role.CUSTOMER },
    });
    customers.push(user);
  }

  const receptionistData = [
    { email: "receptionist1@hotel.com", firstName: "Phạm", lastName: "Thị D", phone: "0944444444" },
    { email: "receptionist2@hotel.com", firstName: "Hoàng", lastName: "Văn E", phone: "0955555555" },
    { email: "receptionist3@hotel.com", firstName: "Mai", lastName: "Thu H", phone: "0977777777" },
  ];

  const receptionists: User[] = [];
  for (const r of receptionistData) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, passwordHash: staffHash, role: Role.RECEPTIONIST },
    });
    receptionists.push(user);
  }

  const housekeepingData = [
    { email: "housekeeping1@hotel.com", firstName: "Ngô", lastName: "Thị I", phone: "0988888881" },
    { email: "housekeeping2@hotel.com", firstName: "Đỗ", lastName: "Văn K", phone: "0988888882" },
    { email: "housekeeping3@hotel.com", firstName: "Vũ", lastName: "Thị L", phone: "0988888883" },
  ];

  const housekeepings: User[] = [];
  for (const h of housekeepingData) {
    const user = await prisma.user.upsert({
      where: { email: h.email },
      update: {},
      create: { ...h, passwordHash: housekeepingHash, role: Role.HOUSEKEEPING },
    });
    housekeepings.push(user);
  }

  console.log(`Seeded users: ${admins.length} admins, ${customers.length} customers, ${receptionists.length} receptionists, ${housekeepings.length} housekeepers`);
  return { admins, customers, receptionists, housekeepings };
}

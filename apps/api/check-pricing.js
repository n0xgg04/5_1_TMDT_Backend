const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const rt = await prisma.roomType.findFirst({
    include: { pricingRules: true },
  });
  console.log("RoomType:", rt?.name);
  console.log("PricingRules count:", rt?.pricingRules?.length);
  console.log(JSON.stringify(rt?.pricingRules, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

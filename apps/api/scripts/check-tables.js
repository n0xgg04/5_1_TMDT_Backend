const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname='public'")
  .then((r) => {
    console.log("Tables:", r.map((x) => x.tablename).join(", "));
    p.$disconnect();
  })
  .catch((e) => {
    console.log("Error:", e.message);
    p.$disconnect();
  });

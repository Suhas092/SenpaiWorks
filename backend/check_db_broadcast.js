
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function check() {
  const users = await prisma.user.findMany();
  console.log("Users:", users);
  const notifs = await prisma.notification.findMany();
  console.log("Notifications:", notifs);
}
check().catch(console.error).finally(() => prisma.$disconnect());


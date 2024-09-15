import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const userCount = await prisma.user.count()
  console.log(userCount)
}
main()
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })

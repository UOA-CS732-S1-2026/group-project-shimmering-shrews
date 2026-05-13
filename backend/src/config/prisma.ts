import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 20000,
    timeout: 30000,
  },
})

export default prisma

import { PrismaClient } from '@prisma/client'

// Shared Prisma client instance used across the backend.
// Using one instance avoids exhausting databse connection pool.
const prisma = new PrismaClient({
  transactionOptions: {
    // Maximum time in ms to wait for a transaction slot to be available
    maxWait: 20000,
    // Maximum time in ms a transaction can run before timing out
    timeout: 30000,
  },
})

export default prisma

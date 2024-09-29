import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// let db: PrismaClient

// declare global {
//   var __db: PrismaClient | undefined
// }

// if (process.env.NODE_ENV === 'production') {
//   db = new PrismaClient()

//   db.$connect()
// } else {
//   if (!global.__db) {
//     global.__db = new PrismaClient()

//     global.__db.$connect()
//   }

//   db = global.__db
// }

// export { db }

// Import needed packages
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Setup
const connectionString = `${process.env.TURSO_DATABASE_URL}`;
const authToken = `${process.env.TURSO_AUTH_TOKEN}`;

// Init prisma client
const libsql = createClient({
  url: connectionString,
  authToken,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

const db = prisma;

export { db };

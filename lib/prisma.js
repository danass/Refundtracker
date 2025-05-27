import { PrismaClient } from '@prisma/client';

console.log('[lib/prisma.js] Initializing Prisma client setup using @prisma/client');

const prismaClientSingleton = () => {
  console.log('[lib/prisma.js] prismaClientSingleton: Creating new PrismaClient instance.');
  return new PrismaClient();
};

// Adjusting for JavaScript, globalThis is standard
const globalForPrisma = globalThis;

let prismaInstance;

if (process.env.NODE_ENV === 'production') {
  if (!globalForPrisma.prismaGlobalInstance) {
    console.log('[lib/prisma.js] Production mode: No global Prisma instance. Creating a new one.');
    globalForPrisma.prismaGlobalInstance = prismaClientSingleton();
  } else {
    console.log('[lib/prisma.js] Production mode: Reusing existing global Prisma instance.');
  }
  prismaInstance = globalForPrisma.prismaGlobalInstance;
} else {
  // In development, always check and recreate if it doesn't exist,
  // or re-assign to ensure hot-reloading picks up the same instance.
  if (!globalForPrisma.prismaGlobalInstance) {
    console.log('[lib/prisma.js] Development mode: No global Prisma instance. Creating a new one.');
    globalForPrisma.prismaGlobalInstance = prismaClientSingleton();
  } else {
    console.log('[lib/prisma.js] Development mode: Reusing existing global Prisma instance for this module scope.');
  }
  prismaInstance = globalForPrisma.prismaGlobalInstance;
  // This specific reassignment helps with Next.js hot reloading if the module itself is re-evaluated.
  // It ensures that any new module evaluation in development still points to the single global instance.
  console.log('[lib/prisma.js] Development mode: Ensuring globalForPrisma.prismaGlobalInstance is the current prismaInstance for hot-reloading.');
  globalForPrisma.prismaGlobalInstance = prismaInstance;
}

export const prisma = prismaInstance;

// The tutorial pattern to re-assign to global in dev to ensure hot-reloading works as expected.
// This block is now redundant due to the logic above but harmless to keep if preferred.
// if (process.env.NODE_ENV !== 'production') {
//     console.log('[lib/prisma.js] Development mode: Assigning current instance to globalForPrisma.prismaGlobalInstance.');
//     globalForPrisma.prismaGlobalInstance = prismaInstance;
// }

console.log('[lib/prisma.js] Prisma client setup complete. Exporting prisma instance.'); 
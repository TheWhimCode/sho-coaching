// prisma.config.ts
import { defineConfig } from "prisma/config";
import 'dotenv/config';

export default defineConfig({
  schema: "prisma/schema.prisma",
  // you can also customize migrations/output/etc. here
});

// src/app/api/_debug/prisma-model/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const models = Prisma.dmmf.datamodel.models;

  const sessionModel = models.find((m: Prisma.DMMF.Model) => m.name === "Session");
  const studentModel = models.find((m: Prisma.DMMF.Model) => m.name === "Student");

  return NextResponse.json({
    sessionFields: sessionModel?.fields.map((f: Prisma.DMMF.Field) => f.name),
    studentFields: studentModel?.fields.map((f: Prisma.DMMF.Field) => f.name),
  });
}

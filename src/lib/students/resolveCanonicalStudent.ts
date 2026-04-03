import type { Prisma, PrismaClient } from "@prisma/client";

type StudentDb = PrismaClient | Prisma.TransactionClient;

function isP2002(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

/**
 * Find or create Student for checkout. Prefer the root `prisma` (not `tx`): a failed
 * `create` + retry must not run inside one PostgreSQL transaction — the first
 * unique-violation aborts the transaction (25P02 on following commands).
 */
export async function resolveCanonicalStudent(
  db: StudentDb,
  args: { discordId?: string | null; discordName?: string | null; riotTag: string }
) {
  const { discordId, discordName, riotTag } = args;

  let student =
    (discordId ? await db.student.findUnique({ where: { discordId } }) : null) ??
    (await db.student.findUnique({ where: { riotTag } }));

  if (!student) {
    const baseName = riotTag ? riotTag.split("#")[0] : "Student";
    let name = baseName;
    for (let i = 0; i < 5; i++) {
      try {
        student = await db.student.create({
          data: {
            name,
            riotTag: riotTag || null,
            discordId: discordId ?? null,
            discordName: discordName ?? null,
          },
        });
        break;
      } catch (e) {
        if (isP2002(e)) {
          name = `${baseName}-${Math.floor(Math.random() * 1000)}`;
          continue;
        }
        throw e;
      }
    }
    if (!student) throw new Error("failed_to_create_student");
  }

  if (discordId && discordId !== student.discordId) {
    try {
      student = await db.student.update({ where: { id: student.id }, data: { discordId } });
    } catch (e) {
      if (!isP2002(e)) throw e;
      const conflict = await db.student.findUnique({ where: { discordId } });
      if (conflict && conflict.id !== student.id) {
        await db.student.update({ where: { id: conflict.id }, data: { discordId: null } });
      }
      student = await db.student.update({ where: { id: student.id }, data: { discordId } });
    }
  }

  if (discordName && discordName !== student.discordName) {
    student = await db.student.update({ where: { id: student.id }, data: { discordName } });
  }

  if (riotTag && riotTag !== student.riotTag) {
    try {
      student = await db.student.update({ where: { id: student.id }, data: { riotTag } });
    } catch (e) {
      if (!isP2002(e)) throw e;
      const conflict = await db.student.findUnique({ where: { riotTag } });
      if (conflict && conflict.id !== student.id) {
        await db.student.update({ where: { id: conflict.id }, data: { riotTag: null } });
      }
      student = await db.student.update({ where: { id: student.id }, data: { riotTag } });
    }
  }

  return student;
}

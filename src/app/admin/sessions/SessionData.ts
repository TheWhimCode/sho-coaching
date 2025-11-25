// src/app/admin/sessions/SessionData.ts

export type SessionData = {
  id: string;
  liveMinutes: number;
  sessionType: string;
  followups: number;
  liveBlocks: number | null;
  notes: string | null;
  scheduledStart: string;  

  studentId: string | null;

  student: {
    name: string | null;
    discordName: string | null;
    riotTag: string | null;
    server: string | null;
  } | null;
};

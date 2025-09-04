import crypto from "crypto";
const SECRET = process.env.ICS_SIGN_SECRET!;
export const sign = (id: string) =>
  crypto.createHmac("sha256", SECRET).update(id).digest("hex");
export const verify = (id: string, sig: string) => sign(id) === sig;

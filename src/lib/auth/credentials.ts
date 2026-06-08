import { timingSafeEqual } from "node:crypto";

/** Comparación en tiempo constante para evitar fugas por timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Valida usuario/contraseña contra las variables de entorno. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;
  // Evaluar ambas siempre para no filtrar cuál falló.
  const okUser = safeEqual(username, expectedUser);
  const okPass = safeEqual(password, expectedPass);
  return okUser && okPass;
}

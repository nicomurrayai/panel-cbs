import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 horas

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no configurado o demasiado corto (mínimo 16 caracteres) en .env.local",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Firma un JWT de sesión para el usuario admin. */
export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verifica el token; devuelve el payload o null si es inválido/expirado. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

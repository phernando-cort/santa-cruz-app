// Backend compartido (Supabase) — MURO, MENSAJES Y AVISOS ENTRE TODOS.
//
// Cómo activarlo (5–10 min, gratis): lee `src/cloud/README.md`.
// 1. Crea un proyecto en https://supabase.com (gratis).
// 2. Ejecuta `src/cloud/supabase-schema.sql` en su SQL Editor.
// 3. Pega aquí la Project URL y la clave pública `anon` (Settings → API).
// 4. Sube la app a GitHub Pages. Listo: todos los teléfonos comparten datos.
//
// La clave `anon` es PÚBLICA por diseño (puede ir en el repo).
// La contraseña de administrador NUNCA va aquí: solo su hash (ADMIN_SHA256).
export const CLOUD = {
  SUPABASE_URL: "https://okaaxtyhivybfcmtjjfs.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_l1z6CbcjVfQrL1OTyY-PQQ_K0HF2Tq4",
  // Hash SHA-256 de la contraseña de administrador (generada para ti; guárdala aparte).
  ADMIN_SHA256: "35138ba97c495447c811e731df22c810d5724213bbce98c5d2a7512c1067cc03",
};

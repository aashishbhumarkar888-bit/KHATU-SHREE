export const ADMIN_EMAILS: string[] = (
  import.meta.env.VITE_ADMIN_EMAILS ||
  'aashishbhumarkar888@gmail.com,admin@khatushri.in'
)
  .split(',')
  .map((e: string) => e.trim().toLowerCase());

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '+919826077123';

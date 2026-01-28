const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new Error("Missing VITE_API_BASE_URL (.env.local)");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

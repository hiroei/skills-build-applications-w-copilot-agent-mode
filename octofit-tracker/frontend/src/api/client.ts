// Relative /api paths go through the Vite dev proxy, so port 8000 never needs to be public.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = await response.json() as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      // Ignore non-JSON failures and fall back to the HTTP status text.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

/** Presented desk credential is `key_id.key_secret`, shown once at mint. */
export function presentedApiKey(data: {
  key?: string | null;
  key_id?: string | null;
  key_secret?: string | null;
}): string | null {
  if (typeof data.key === "string" && data.key.includes(".")) return data.key;
  if (data.key_id && data.key_secret) return `${data.key_id}.${data.key_secret}`;
  return null;
}

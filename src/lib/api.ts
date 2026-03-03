function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL ?? "";
  const candidates = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter(isHttpUrl)
    .map(normalizeUrl);

  if (candidates.length === 0) {
    return "http://localhost:3001";
  }

  if (typeof window === "undefined") {
    return candidates[0];
  }

  const currentHost = window.location.hostname;
  const currentOrigin = normalizeUrl(window.location.origin);

  const exactMatch = candidates.find((value) => value === currentOrigin);
  if (exactMatch) {
    return exactMatch;
  }

  const localhostMatch = candidates.find((value) => {
    try {
      return new URL(value).hostname === currentHost;
    } catch {
      return false;
    }
  });

  if (localhostMatch) {
    return localhostMatch;
  }

  const productionMatch = candidates.find((value) => !value.includes("localhost"));
  return productionMatch ?? candidates[0];
}

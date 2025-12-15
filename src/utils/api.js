// Centralized API client to eliminate sporadic "Failed to fetch"
// Features: base URL, timeouts, retries with backoff, JSON parsing, standardized errors

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export class ApiError extends Error {
  constructor(message, { status, url, cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? null;
    this.url = url ?? null;
    this.cause = cause;
  }
}

export function getBaseUrl() {
  // Prefer Vite env var; fallback to same-origin
  const envUrl = import.meta?.env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return ""; // relative requests (same origin)
}

export async function request(path, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const {
    timeout = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = 400,
    headers = {},
    ...rest
  } = options;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
        ...rest,
      });
      clearTimeout(t);

      if (!resp.ok) {
        // Try to read error body if possible
        let detail = "";
        try {
          const data = await resp.json();
          detail = typeof data === "string" ? data : JSON.stringify(data);
        } catch {}
        throw new ApiError(
          `Request failed (${resp.status})${detail ? `: ${detail}` : ""}`,
          { status: resp.status, url }
        );
      }

      // Attempt JSON first; fallback to text
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await resp.json();
      }
      return await resp.text();
    } catch (err) {
      clearTimeout(t);
      lastErr = err;

      const isAbort = err?.name === "AbortError";
      const isNetwork = err?.message?.includes("Failed to fetch") || err?.cause;
      const canRetry = attempt < retries && (isAbort || isNetwork);
      if (canRetry) {
        await sleep(retryDelayMs * (attempt + 1)); // simple backoff
        continue;
      }
      // Standardize error
      if (!(err instanceof ApiError)) {
        throw new ApiError(isAbort ? "Request timed out" : "Network error", {
          url,
          cause: err,
        });
      }
      throw err;
    }
  }
  // Shouldn't reach here, but in case
  throw new ApiError("Unknown error", { url: path, cause: lastErr });
}

export async function get(path, opts) {
  return request(path, { method: "GET", ...opts });
}

export async function post(path, body, opts) {
  return request(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
}

export async function put(path, body, opts) {
  return request(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
}

export async function del(path, opts) {
  return request(path, { method: "DELETE", ...opts });
}

// Single place that knows where the API Gateway lives.
// - In the browser, NEXT_PUBLIC_API_URL (baked at build time) points at the
//   publicly reachable gateway, e.g. http://localhost:8080
// - In server components, INTERNAL_API_URL points at the gateway on the
//   compose network, e.g. http://api-gateway:8080
export function apiUrl(path: string) {
  const base =
    typeof window === "undefined"
      ? (process.env.INTERNAL_API_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:8080")
      : (process.env.NEXT_PUBLIC_API_URL ?? "");
  return `${base}${path}`;
}

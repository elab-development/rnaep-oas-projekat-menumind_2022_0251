# MenuMind - AI-Powered Restaurant Platform (Microservice Edition)

**MenuMind** is a digital menu and restaurant management platform: restaurants manage menus,
categories and items in real time; guests scan a table QR code and chat with an AI assistant that
knows the restaurant's actual menu.

This repository contains the **enterprise-grade microservice version** of MenuMind: the original
Next.js frontend (same UI, UX and business flows) backed by an event-driven system of 7 services,
polyglot persistence (PostgreSQL + MongoDB), Apache Kafka, an API Gateway, and a full
Prometheus/Grafana monitoring stack - everything started by a single `docker compose up`.

---

## Architecture

```
Browser ──► Next.js Frontend (:3000)
                 │  all /api/* calls
                 ▼
          API Gateway (:8080)  ← CORS · rate-limit · security headers · origin check · metrics
   ┌────────┬─────────┬────────────┬──────────┬────────────┬─────────┐
   ▼        ▼         ▼            ▼          ▼            ▼
 Auth     Menu     Recommendation  Analytics  Notification  Media
 :4001    :4002    /AI :4003       :4004      :4005         :4006
   │        │         │            │          │             (stateless)
 Postgres Postgres  MongoDB      MongoDB    MongoDB
 auth-db  menu-db   recommendation- analytics- notification-
                    mongo          mongo      mongo

 ───────────────── Apache Kafka (KRaft — no ZooKeeper) ─────────────────
   topics: user-created · menu-item-created · menu-viewed ·
           recommendation-generated · notification-sent

 Prometheus (:9090) + Grafana (:3001) + kafka-exporter + cAdvisor (:8081)
```

| Service                    | Responsibility                                                                                                                 | Datastore               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **api-gateway**            | Single entry point; routing, CORS, rate limiting, security headers, CSRF origin check                                          | —                       |
| **auth-service**           | Users, sessions, roles (better-auth); session introspection for all services; produces `user-created`                          | PostgreSQL (relational) |
| **menu-service**           | Restaurants, categories, menu items; public menu; OpenFoodFacts nutrition lookups; produces `menu-item-created`, `menu-viewed` | PostgreSQL (relational) |
| **recommendation-service** | AI chat (Gemini) + **Kafka processor**: consumes `menu-item-created`, produces `recommendation-generated`                      | MongoDB (documents)     |
| **analytics-service**      | Consumes **all five** topics into per-restaurant stats; currency conversion via exchange-rate API                              | MongoDB (documents)     |
| **notification-service**   | Consumes `recommendation-generated` + `user-created`; produces `notification-sent`                                             | MongoDB (documents)     |
| **media-service**          | Cloudinary upload signatures                                                                                                   | —                       |

---

## Quick start (Docker - the whole system)

```bash
cp .env.example .env        # optional: add API keys; works with an empty .env too
docker compose up --build
```

| URL                                 | What                                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| http://localhost:3000               | MenuMind frontend                                                |
| http://localhost:3000/r/demo-bistro | Public demo menu + AI chat (guest view)                          |
| http://localhost:8080               | API Gateway (only published API surface)                         |
| http://localhost:9090               | Prometheus                                                       |
| http://localhost:3001               | Grafana (admin / admin) — dashboard “MenuMind — System Overview” |
| http://localhost:8081               | cAdvisor container metrics                                       |

Seeded accounts (change via `.env`):

| Role                           | Email                  | Password     |
| ------------------------------ | ---------------------- | ------------ |
| System admin                   | `admin@menumind.local` | `admin12345` |
| Restaurant admin (Demo Bistro) | `demo@menumind.local`  | `demo12345`  |

Optional API keys in `.env` (features degrade gracefully without them):

- `GOOGLE_GENERATIVE_AI_API_KEY` - real Gemini AI chat/recommendations (otherwise heuristic fallback answers).
- `CLOUDINARY_*` - menu-item image uploads (otherwise upload returns 503, rest of dashboard works).

## Local development (frontend only)

```bash
pnpm install
docker compose up -d api-gateway   # backend stack in Docker
pnpm dev                            # frontend on :3000 against gateway :8080
```

Frontend tests / lint / build: `pnpm test`, `pnpm lint`, `pnpm build`.
Per-service tests: `cd services/<name> && npm install && npm test` (pure-logic tests, no
infrastructure needed).

---

## Kafka - event-driven architecture

Five topics, multiple producers, multiple consumers, and one **processor** service that is both:

```
auth-service ──user-created──────────────► analytics, notification
menu-service ──menu-item-created─────────► recommendation, analytics, notification
menu-service ──menu-viewed───────────────► analytics
recommendation-service ──recommendation-generated──► notification, analytics
notification-service ──notification-sent─► analytics
```

The processor chain (create a menu item in the dashboard to watch it fire):

```
menu-service ─► recommendation-service (consume → Gemini/heuristic → produce) ─► notification-service ─► analytics-service
```

- Kafka runs in **KRaft mode** (`apache/kafka:3.9.1`) - no ZooKeeper container is needed.
- Producers are fire-and-forget with retries; consumers reconnect forever; a dead broker never
  breaks an HTTP request (`services/*/src/lib/kafka.js`).
- Verify events: `docker exec -it menumind-kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic recommendation-generated --from-beginning`

## Distributed pattern - Circuit Breaker (Opossum)

| Breaker                              | Protects                             | Fallback                                |
| ------------------------------------ | ------------------------------------ | --------------------------------------- |
| `auth-session` (every service)       | session introspection → auth-service | fail fast `503`                         |
| `gemini` (recommendation-service)    | AI chat + suggestion generation      | deterministic heuristic recommendations |
| `openfoodfacts` (menu-service)       | nutrition lookups                    | `{source:"fallback", items:[]}`         |
| `exchange-rates` (analytics-service) | currency conversion                  | cached rates → 1:1 EUR                  |

Breaker state is exported as the `circuit_breaker_state` Prometheus metric and visible in Grafana.

## External APIs

1. **OpenFoodFacts** (free, keyless) — `GET /api/nutrition?query=pizza` - nutrition facts for admins composing menu items.
2. **open.er-api.com** (free, keyless) - `GET /api/analytics/me/summary?currency=USD` — converts price aggregates from EUR.
3. **Google Gemini** (existing integration, free tier) - AI chat + recommendations.
4. **Cloudinary** (existing integration, free tier) - signed image uploads.

## Monitoring

- Every service: `GET /health` + `GET /metrics` (prom-client: HTTP histograms, Kafka counters, breaker state, Node defaults).
- **Prometheus** (`monitoring/prometheus/prometheus.yml`) scrapes the gateway, all 6 services, kafka-exporter (topic/consumer-lag metrics) and cAdvisor (container CPU/RAM/network).
- **Grafana** is auto-provisioned (`monitoring/grafana/`) with the _MenuMind — System Overview_ dashboard: service health, request rate, p95 latency, 5xx rate, breaker states, Kafka throughput & lag, container resources. Login `admin`/`admin` at http://localhost:3001.

## CI/CD (GitHub Actions)

| Workflow                       | Trigger                        | What it does                                                           |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | every push                     | frontend lint + tests + build; per-service lint + tests (7-job matrix) |
| `.github/workflows/pr.yml`     | PRs to `main`/`develop`        | compose validation, docs presence, frontend + service test matrix      |
| `.github/workflows/docker.yml` | pushes/PRs to `main`/`develop` | builds Docker images for **all 8 images**; publishes to GHCR on `main` |

## Team workflow & security

- **GitFlow** (branches, protection rules, release flow)
- **Kanban board**
- **Security** (XSS, CSRF, IDOR, CORS, SQL injection - measure by measure)

## Repository layout

```
app/                    Next.js frontend (unchanged UI/UX; API calls go to the gateway)
services/
  api-gateway/          entry point: routing + security policies
  auth-service/         better-auth + PostgreSQL, user-created producer
  menu-service/         core domain + PostgreSQL, OpenFoodFacts, Kafka producers
  recommendation-service/  AI chat + Kafka processor + MongoDB
  analytics-service/    Kafka consumer (5 topics) + MongoDB + exchange rates
  notification-service/ Kafka consumer/producer + MongoDB
  media-service/        Cloudinary signing (stateless)
monitoring/             Prometheus config + Grafana provisioning & dashboard
docker-compose.yml      the entire system: docker compose up
```

## API documentation

The REST contract is unchanged from the monolith (same paths, now served through the gateway).
The Scalar docs UI remains at `http://localhost:3000/api-docs` (serving `public/openapi.json`).
Note: `/api/auth/*` is handled by better-auth and excluded from the generated endpoint docs.

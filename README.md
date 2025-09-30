# DockerHub Clone

A simplified DockerHub-like platform built with **Spring Boot (backend)** and **Next.js (frontend)**.  
Includes support for **PostgreSQL**, **Redis**, **Elasticsearch**, **pgAdmin**, and **Nginx** reverse proxy.

---

## Super Admin Account

On first startup the system will auto-generate a **super admin** account:

- **Username:** `superadmin`
- **Email:** `superadmin@system.local`
- **Password:** Randomly generated and saved to a file:

```
super-admin-initial-password.txt
```

- **Local run:** File is created inside backend project root.
- **Docker run:** File is inside backend container under `/app/super-admin-initial-password.txt`.

---

## Running Locally

### Prerequisites

- Java 17+
- Node.js 20+
- PostgreSQL
- Redis
- Elasticsearch

### Steps

1. Start Elasticsearch locally.
2. Use appropriate Spring profile:
   - `application.properties` → H2 in-memory database (quick dev).
3. Run backend:
   ```bash
   cd backend/dockerhub-clone
   ./mvnw spring-boot:run
   ```
4. Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api

---

## Running with Docker Compose

### Prerequisites

- Docker
- Docker Compose v2+

### Steps

1. Build & start all services:

   ```bash
   docker compose up --build
   ```

   Services:

   - **Postgres** (5432)
   - **Redis** (6379)
   - **Elasticsearch** (9200)
   - **Backend** (8080)
   - **Frontend** (3000)
   - **Nginx** (80)
   - **pgAdmin** (5050)

2. Access:

   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - pgAdmin: http://localhost:5050 (user: `admin@admin.com`, pass: `admin`)
   - Elasticsearch: http://localhost:9200

3. Retrieve superadmin password:
   ```bash
   docker exec -it uks-backend cat /app/super-admin-initial-password.txt
   ```

---

## Notes

- **Nginx** forwards traffic:

  - `/` → frontend
  - `/api/` → backend

- **Postgres default credentials**:

  - user: `postgres`
  - pass: `postgres`
  - db: `dockerhub`

- **Elasticsearch** is used for analytics (system log searching). Ensure it’s healthy at http://localhost:9200.

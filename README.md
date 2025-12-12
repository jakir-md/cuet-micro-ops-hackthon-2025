# 🚀 Delineate: Resilient Download System (Micro-Ops Hackathon)

A production-grade microservice architecture designed to handle long-running processes (120s+) behind strict proxy timeouts (Cloudflare/Nginx).

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![Sentry](https://img.shields.io/badge/Sentry-Enabled-362D59)

## 🏆 Challenges Solved

| Challenge | Status | Implementation Details |
| :--- | :--- | :--- |
| **1. S3 Storage** | ✅ Completed | integrated **MinIO** container. Files are uploaded to `downloads` bucket automatically on completion. |
| **2. Architecture** | ✅ Completed | Implemented **Async Polling Pattern** to bypass 100s proxy timeouts. Decoupled initiation from processing. |
| **3. CI/CD** | ✅ Completed | GitHub Actions pipeline that runs **Linting**, **E2E Tests** (against live MinIO), and **Docker Build**. |
| **4. Observability** | ✅ Completed | **Sentry** for error tracking + **OpenTelemetry (Jaeger)** for distributed tracing. React Dashboard included. |

---

## 🏛️ Architecture: The Polling Pattern

To solve the "Gateway Timeout" problem, we moved from a Synchronous model to an Asynchronous Job Queue model.



1.  **Initiate (`POST /v1/download/initiate`):** Returns `202 Accepted` immediately with a `jobId`.
2.  **Process:** Background worker starts the 120s simulation and streams data to MinIO S3.
3.  **Poll (`GET /v1/download/status/:jobId`):** Client checks progress every 2s.
4.  **Complete:** Returns the final S3/MinIO download URL.

---

## 🛠️ How to Run Locally

### Prerequisites
* Docker & Docker Compose
* Node.js 24 (Optional, for local dev)

### 1. Start the Stack (Backend + S3 + Jaeger)
```bash
npm run docker:dev
# Architecture Design: Long-Running Download System

## 1. The Core Problem
The current system processes file downloads that take **10-120 seconds**. However, standard reverse proxies (Cloudflare, AWS ALB, Nginx) enforce strict timeouts (typically **60-100 seconds**). This causes:
* **504 Gateway Timeouts** for users.
* **Wasted Server Resources** (the process continues running even after the client disconnects).
* **Poor UX** (users stare at a loading spinner until it crashes).

## 2. Proposed Solution: Async Polling Pattern
We will implement an **Asynchronous Job Queue** pattern. This decouples the *initiation* of the request from the *execution*.

### High-Level Data Flow


1.  **Initiate:** Client sends `POST /v1/download/initiate`.
2.  **Queue:** API generates a `jobId`, sets status to `pending`, and starts processing in the background.
3.  **Ack:** API immediately returns `202 Accepted` with `{ "jobId": "abc-123", "status": "pending" }`.
4.  **Poll:** Client polls `GET /v1/download/status/abc-123` every 3 seconds.
5.  **Complete:** Once processing finishes, the file is uploaded to **MinIO (S3)**.
6.  **Retrieve:** The polling endpoint returns `{ "status": "completed", "downloadUrl": "http://minio/..." }`.

## 3. API Contract Changes

### A. Initiate Download (New)
* **Endpoint:** `POST /v1/download/initiate`
* **Response (202 Accepted):**
    ```json
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "etaSeconds": 60
    }
    ```

### B. Check Status (New)
* **Endpoint:** `GET /v1/download/status/:jobId`
* **Response (200 OK - Processing):**
    ```json
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "processing",
      "progress": 45
    }
    ```
* **Response (200 OK - Completed):**
    ```json
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "downloadUrl": "http://localhost:9000/downloads/file-70000.zip"
    }
    ```

## 4. Technical Implementation Details
* **State Management:** We will use an in-memory `Map<string, Job>` (Simulating Redis for this hackathon) to track job statuses.
* **Storage:** Processed files are streamed directly to **MinIO** to avoid disk usage on the API container.
* **Concurrency:** Background jobs run independently of the HTTP request loop.

## 5. Proxy Configuration (Nginx/Cloudflare)
This architecture is **timeout-proof**.
* **Cloudflare:** No special config needed because no request lasts longer than ~50ms.
* **Nginx:** Standard configuration works. We bypass the `proxy_read_timeout` issue entirely.

## 6. Frontend Integration (React/Next.js)
* **Component:** `DownloadButton` component handles the logic.
* **State:** Uses `React Query` or simple `setInterval` to poll.
* **UX:** Shows a real progress bar instead of a frozen screen.
* **Resilience:** If the user closes the tab, they can resume polling (if we saved the `jobId` in localStorage).
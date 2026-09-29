# Tourism Digital Wallet

A MERN travel information vault where authenticated users manage trips, travel items, important dates, and document attachments.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod
- **Backend:** Node.js, Express, TypeScript, Mongoose, Zod, JWT, bcrypt
- **Database:** MongoDB Atlas (metadata only for files)
- **Object storage:** Cloudflare R2 (private documents)
- **Deploy:** Vercel (frontend), Render (backend)

## Storage architecture

```text
Frontend
   ↓ request upload authorization
Backend (auth + ownership + validation)
   ↓ presigned URL
Cloudflare R2 (file bytes)
   ↓ confirm
MongoDB Attachment metadata
```

Files are **never** stored as binaries in MongoDB. R2 credentials stay on the backend only.

### Upload flow

1. Authenticated client requests `POST /api/trips/:tripId/items/:itemId/attachments/upload-url`
2. Backend verifies trip/item ownership, validates MIME type + size, returns a short-lived R2 PUT URL
3. Browser uploads the file **directly to R2**
4. Client confirms with `POST .../attachments`
5. Backend verifies the object exists, then saves metadata

### Access flow

`GET /api/attachments/:attachmentId/url` returns a short-lived signed download URL after ownership checks.

### Delete flow

`DELETE /api/attachments/:attachmentId` deletes the R2 object, then the MongoDB metadata.

## File limits

| Rule | Value |
|------|--------|
| Allowed types | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` |
| Max size | `MAX_FILE_SIZE_MB` (default **10**) |

## Environment variables

### Backend (`server/.env`)

See `server/.env.example` for placeholders:

- `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ALLOW_VERCEL`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- `R2_ENDPOINT` (optional; defaults to `https://{accountId}.r2.cloudflarestorage.com`)
- `MAX_FILE_SIZE_MB`, `R2_UPLOAD_URL_EXPIRES_IN`, `R2_DOWNLOAD_URL_EXPIRES_IN`

**Never** put R2 secrets in Vercel frontend env vars.

### Frontend (`client/.env`)

- `VITE_API_URL` — backend API origin (local or Render)

## Local setup

1. Configure Cloudflare R2: create a private bucket + API token with Object Read/Write.
2. Copy `server/.env.example` → `server/.env` and fill MongoDB, JWT, CORS, and R2 values.
3. Copy `client/.env.example` → `client/.env` with `VITE_API_URL=http://localhost:5000`.
4. Run:

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

## Deployment notes

- Add R2 variables on **Render** (backend).
- Frontend on Vercel only needs `VITE_API_URL`.
- Keep the R2 bucket **private**; use signed URLs from the API.

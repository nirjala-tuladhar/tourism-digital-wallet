# Tourism Digital Wallet

A MERN travel information vault where authenticated users manage trips, travel items, important dates, and document attachments.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod
- **Backend:** Node.js, Express, TypeScript, Mongoose, Zod, JWT, bcrypt
- **Database:** MongoDB Atlas (metadata only for files)
- **Object storage:** Backblaze B2 via S3-compatible API (private documents)
- **Deploy:** Vercel (frontend), Render (backend)

## Storage architecture

```text
Frontend
   ↓ request upload authorization
Backend (auth + ownership + validation)
   ↓ presigned URL
Backblaze B2 (file bytes)
   ↓ confirm
MongoDB Attachment metadata
```

Files are **never** stored as binaries in MongoDB. B2 credentials stay on the backend only.

The backend talks to B2 through the **S3-compatible API** using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

### Upload flow

1. Authenticated client requests `POST /api/trips/:tripId/items/:itemId/attachments/upload-url`
2. Backend verifies trip/item ownership, validates MIME type + size, returns a short-lived B2 PUT URL
3. Browser uploads the file **directly to B2**
4. Client confirms with `POST .../attachments`
5. Backend verifies the object exists, then saves metadata

### Access flow

`GET /api/attachments/:attachmentId/url` returns a short-lived signed download URL after ownership checks.

### Delete flow

`DELETE /api/attachments/:attachmentId` deletes the B2 object, then the MongoDB metadata.

## File limits

| Rule | Value |
|------|--------|
| Allowed types | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` |
| Max size | `MAX_FILE_SIZE_MB` (default **10**) |

## Environment variables

### Backend (`server/.env`)

See `server/.env.example` for placeholders:

- `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ALLOW_VERCEL`
- `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`
- `B2_REGION` (example: `us-east-005`)
- `B2_ENDPOINT` (example: `https://s3.us-east-005.backblazeb2.com`)
- `MAX_FILE_SIZE_MB`, `B2_UPLOAD_URL_EXPIRES_IN`, `B2_DOWNLOAD_URL_EXPIRES_IN`

**Never** put B2 secrets in Vercel frontend env vars.

### Frontend (`client/.env`)

- `VITE_API_URL` — backend API origin (local or Render)

## B2 CORS (browser → B2)

Presigned uploads hit B2 directly from the browser. Configure **bucket CORS** in the Backblaze console separately from Express CORS.

Suggested allowed origins:

- Local: `http://localhost:5173`
- Staging/production: your Vercel frontend origin(s)

Allow methods such as `PUT`, `GET`, `HEAD` and the headers your signed requests use (at least `Content-Type` / `Authorization` as required by your B2 CORS policy).

Keep the bucket **private** — do not open objects publicly.

## Local setup

1. Create a private Backblaze B2 bucket and an Application Key with read/write on that bucket.
2. Copy `server/.env.example` → `server/.env` and fill MongoDB, JWT, CORS, and B2 values.
3. Copy `client/.env.example` → `client/.env` with `VITE_API_URL=http://localhost:5000`.
4. Configure B2 bucket CORS for your frontend origin.
5. Run:

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

## Deployment notes

- Add B2 variables on **Render** (backend).
- Frontend on Vercel only needs `VITE_API_URL`.
- Keep the B2 bucket **private**; use signed URLs from the API.
- Add your Vercel origin to the B2 bucket CORS rules for staging/production uploads. Use `https://*.vercel.app` so preview URLs work too.

## Search, expiry, and notifications

`GET /api/search` matches the signed-in user's trips and travel items. Words can come from different records: `Nepal hotel` finds a hotel item on a Nepal trip. Active trips rank first. Inactive trips stay in the results and are labeled.

Travel items have an optional `expiresAt`. "Expiring soon" is the widest reminder window (30 days). Notifications are stored once per user, item, expiry date, and window (`30`, `7`, `1`, today, or expired), so a refresh does not insert another copy. Sync runs when the dashboard or notification list loads. The same function can move to a scheduled job later.

- `GET /api/search`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`


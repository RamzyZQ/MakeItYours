<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy MakeitYours

Photobooth editor for creating two-sided keychain designs.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_WHATSAPP_NUMBER` in [.env.local](.env.local) (international format, without `+`).
3. Run the app:
   `npm run dev`

## Vercel order storage

The checkout API stores the front and back PNGs in a dedicated Google Drive folder, sends only the order code to WhatsApp, and removes Drive files older than 30 days.

1. Create an Upstash Redis database and enable the Google Drive API in a Google Cloud project.
2. Create a dedicated order folder, share it with the service-account email as an editor, and keep the service-account key private. The cleanup job only removes old files carrying this app's order metadata.
3. Add these server-only environment variables in Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `GOOGLE_DRIVE_FOLDER_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON` (the complete service-account JSON on one line)
   - `CRON_SECRET` (a long random value used to protect the cleanup endpoint)
   - `VITE_WHATSAPP_NUMBER`
4. Deploy to Vercel. The daily cron in [vercel.json](./vercel.json) deletes expired files from the configured folder.

The Vite-only `npm run dev` server does not run Vercel API functions. Use `vercel dev` with the same environment variables to test Drive checkout locally. Never add Google credentials or Upstash tokens to a `VITE_` variable or commit them.

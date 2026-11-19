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
2. Create an OAuth client ID for a Web application. Set `https://developers.google.com/oauthplayground` as an authorized redirect URI, configure the OAuth consent screen, and add your Gmail account as a test user if the app is in testing.
3. In OAuth Playground settings, enable **Use your own OAuth credentials** and enter the OAuth client ID and secret. Authorize `https://www.googleapis.com/auth/drive` with the Gmail account that owns the order folder, then exchange the authorization code for tokens. Use the resulting refresh token as `GOOGLE_REFRESH_TOKEN`. The full Drive scope is needed because the app accesses a folder configured by ID and the cleanup job deletes expired uploads.
4. Create a dedicated order folder in that Gmail account's Drive and set `GOOGLE_DRIVE_FOLDER_ID` to its ID. The cleanup job only removes old files carrying this app's order metadata.
5. Add these server-only environment variables in Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `GOOGLE_DRIVE_FOLDER_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `CRON_SECRET` (a long random value used to protect the cleanup endpoint)
   - `VITE_WHATSAPP_NUMBER`
6. Deploy to Vercel. The daily cron in [vercel.json](./vercel.json) deletes expired files from the configured folder.

The Vite-only `npm run dev` server does not run Vercel API functions. Use `vercel dev` with the same environment variables to test Drive checkout locally. Never add Google credentials or Upstash tokens to a `VITE_` variable or commit them.

If the OAuth consent screen remains in **Testing** with an External user type, Google may expire refresh tokens after seven days. For uninterrupted production use, move the app out of Testing and complete any Google verification required for the Drive scope.

# Deployment & Architecture Mandate

## 1. CORS & Cross-Origin Handshake Preparation
To successfully process account deletion requests from the Next.js marketing site (`/veri-silme`), the Express.js backend hosted on Render must be updated to whitelist the production web domains.

**Backend Configuration Update Requirement:**
The backend `cors` configuration in `server.js` (or your entry point) must be explicitly updated.
Currently it may only allow mobile origins or `localhost`. You MUST add:
- `https://uniride.com`
- `https://www.uniride.com`

**Example Express Configuration:**
```javascript
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://uniride.com',
        'https://www.uniride.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use(cors(corsOptions));
```

This prevents Cross-Origin Resource Sharing (CORS) blocks during the asynchronous handshake when users submit the account deletion form.

## 2. Vercel Deployment Protocol

**Git Integration & CI/CD:**
1. Push the `web` directory to a dedicated GitHub repository, or if managing a Monorepo, configure Vercel's Root Directory setting to exclusively point to the `web` folder.
2. The Vercel build command is already optimized in `package.json` to handle strict type-checking and linting *before* Next.js compiles:
   - Build Command: `npm run build`
   - Install Command: `npm install` (or Yarn/PNPM equivalent)

**Environment Variables:**
In the Vercel Dashboard under **Settings > Environment Variables**, you must add:
- `NEXT_PUBLIC_API_URL` = `https://uniride-backend.onrender.com/api`
*(Reference: `.env.example` in the source repository)*

**Custom Domain Provisioning:**
1. In the Vercel Dashboard, navigate to **Settings > Domains**.
2. Add your custom domain (e.g., `uniride.com` and `www.uniride.com`).
3. Vercel will prompt you to add specific A or CNAME records to your DNS provider (e.g., Cloudflare, GoDaddy).
4. SSL/TLS certificates will be automatically provisioned and managed by Vercel's Edge Network, yielding zero-latency global edge caching out of the box.

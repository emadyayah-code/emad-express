# Emad Express — Hosting package

## What is included

- `artifacts/admin-panel/dist/public`: production build of the admin panel.
- `artifacts/api-server/dist`: production Node.js API bundle.
- `server.js`: cPanel/Passenger startup file.
- `.htaccess`: Apache/Passenger configuration.
- `.env.example`: database and runtime settings template.
- `assets/uploads`: persistent location for uploaded images.

## cPanel deployment

1. Upload and extract this ZIP into the Node.js application directory.
2. In **cPanel > Setup Node.js App**, choose Node.js 18+ (Node.js 20 is recommended).
3. Set the application root to this directory and the startup file to `server.js`.
4. Copy `.env.example` to `.env` locally, fill in the database values supplied by your
   hosting provider, or add the same variables in cPanel's environment-variable section.
   Do not expose `.env` publicly.
5. Ensure the PostgreSQL extension/service is available and that the database user can
   connect from this hosting account.
6. Run `npm install --omit=dev` only if the host does not already contain the bundled
   dependencies, then restart the Node.js application.

## Admin login

The existing seed data creates the administrator account:

- Email: `ealakhly@gmail.com`
- Password: `772223645`

Change this password immediately after the first successful login. The API currently
stores passwords as plain text in the existing schema; for a public production deployment,
replace that with Argon2 or bcrypt hashing before accepting real customer accounts.

## Important database note

The source code uses `drizzle-orm/node-postgres`, so `DATABASE_URL` must point to a
PostgreSQL database. The supplied account name looks like a cPanel database account and
may be a MySQL account. If the host only provides MySQL, the application will not connect
until the database layer is migrated to MySQL; do not change the URL to a MySQL URL without
also changing the adapter and schema.

## Build note

This delivery contains the complete source, lockfile, assets, deployment files, and the
build scripts. Run `bash deploy.sh` on the hosting server before starting the app; it
creates the two production `dist` folders. `node_modules` and production `dist` files
are intentionally not embedded in the ZIP because they are host/OS-specific and
should be generated on the target server.
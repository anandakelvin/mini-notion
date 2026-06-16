# Architecture & Development Guide

## Known Pitfalls & Gotchas

### Prisma 7+ SQLite Driver Adapter Configuration
* **Issue**: When migrating to SQLite using the Prisma 7 driver adapter `@prisma/adapter-better-sqlite3`, passing the instantiated `better-sqlite3` database object (client instance) directly to the `PrismaBetterSqlite3` constructor will result in a `TypeError: Cannot read properties of undefined (reading 'replace')` inside the driver's connection initialization (i.e. `createBetterSQLite3Client`).
* **Root Cause**: In Prisma 7, the `@prisma/adapter-better-sqlite3` constructor expects a configuration object containing the URL and other options, rather than the raw database client itself.
* **Resolution**: Pass a config object with the `url` property (e.g., `new PrismaBetterSqlite3({ url })`) to the adapter constructor.

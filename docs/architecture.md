# Architecture & Development Guide

## Known Pitfalls & Gotchas

### Prisma 7+ SQLite Driver Adapter Configuration
* **Issue**: When migrating to SQLite using the Prisma 7 driver adapter `@prisma/adapter-better-sqlite3`, passing the instantiated `better-sqlite3` database object (client instance) directly to the `PrismaBetterSqlite3` constructor will result in a `TypeError: Cannot read properties of undefined (reading 'replace')` inside the driver's connection initialization (i.e. `createBetterSQLite3Client`).
* **Root Cause**: In Prisma 7, the `@prisma/adapter-better-sqlite3` constructor expects a configuration object containing the URL and other options, rather than the raw database client itself.
* **Resolution**: Pass a config object with the `url` property (e.g., `new PrismaBetterSqlite3({ url })`) to the adapter constructor.

### NestJS Event Emitter Wildcard Subscriptions
* **Issue**: Subscribing to wildcard events (e.g., `@OnEvent('note.*.updated')`) does not trigger when events (e.g., `note.123.updated`) are emitted.
* **Root Cause**: By default, `EventEmitterModule.forRoot()` disables wildcard matching to optimize performance.
* **Resolution**: Explicitly enable wildcards by passing the configuration option: `EventEmitterModule.forRoot({ wildcard: true })` in the application root module.


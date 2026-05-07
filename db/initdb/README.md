# Postgres init scripts

Files here run **once** on first boot of the `postgres` container, when the
`pg_data` volume is empty. The official `postgres:16` image executes any
`*.sql`, `*.sql.gz`, or `*.sh` files in this directory in sorted order.

## Files

- **`01_seed.sql`** — full dump of the local dev Mongo mirror (40 tables,
  ~381 rows). Re-generate from a fresh source with:

  ```bash
  pg_dump -d quickhire_mongo -F p --no-owner --no-acl > db/initdb/01_seed.sql
  ```

## Re-seeding

The seed only runs on a **fresh volume**. To force a clean re-seed:

```bash
docker compose down --volumes        # destroys pg_data
docker compose up -d postgres        # boots clean and re-runs initdb
```

## Production note

This seed is **dev data** only. Production (Render/Neon) does not use this
container — it connects to a managed Postgres via `PG_URL` and is seeded
by running the migration scripts (`pg-migrate.js`, `pg-mirror-all.js`)
against Atlas.

-- This file runs on first container start only (via docker-entrypoint-initdb.d).
-- EF Core migrations handle the actual schema. This just ensures extensions are enabled.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

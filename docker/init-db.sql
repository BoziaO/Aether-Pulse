-- Nicori Database Initialization
-- This script runs when PostgreSQL container starts for the first time

-- Create extension for UUID if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_cron for scheduled jobs (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Database configuration
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- Note: Tables will be created by Drizzle ORM migrations
-- This file is just for initial database configuration

-- Create a function to check if migrations table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drizzle_migrations') THEN
        RAISE NOTICE 'Drizzle migrations table does not exist yet. Run migrations.';
    END IF;
END $$;

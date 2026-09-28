-- Apply before the backend release when Hibernate ddl-auto is validate/none.
-- Additive migration: legacy amount remains the original KRW amount.
ALTER TABLE asset ADD COLUMN IF NOT EXISTS currency varchar(255);
ALTER TABLE asset ADD COLUMN IF NOT EXISTS foreign_amount numeric(24,8);
CREATE TABLE IF NOT EXISTS exchange_rate (
    currency varchar(255) PRIMARY KEY,
    rate numeric(24,8),
    source varchar(255),
    as_of varchar(255),
    fetched_at timestamp(6) with time zone
);

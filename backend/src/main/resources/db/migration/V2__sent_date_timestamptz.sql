-- sent_date saat dilimi bilgisi olmadan tutuluyordu: backend İstanbul saatiyle, PostgreSQL ise UTC ile yazıyordu.
-- TIMESTAMPTZ kesin bir an saklar; mevcut kayıtlar backend'in yazdığı İstanbul saati kabul edilerek çevrilir.
ALTER TABLE contact_messages
    ALTER COLUMN sent_date TYPE TIMESTAMPTZ USING sent_date AT TIME ZONE 'Europe/Istanbul';

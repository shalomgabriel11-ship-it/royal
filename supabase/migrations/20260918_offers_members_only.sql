-- Migration: 20260918_offers_members_only.sql
-- Add members_only boolean column to offers table

alter table offers add column if not exists members_only boolean not null default false;

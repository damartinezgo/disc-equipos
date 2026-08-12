-- Migration: create otp_codes table for custom OTP verification
-- Description: Store 6-digit OTP codes with expiry for registration flow

create table if not exists otp_codes (
  id bigserial primary key,
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists otp_codes_email_idx on otp_codes(email);
create index if not exists otp_codes_code_idx on otp_codes(code);
create index if not exists otp_codes_expires_idx on otp_codes(expires_at);

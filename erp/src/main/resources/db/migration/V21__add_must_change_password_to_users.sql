-- V21: Add must_change_password flag to users table
-- Existing users keep false (no forced change); new users are set to true by UserService.registerUser().
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

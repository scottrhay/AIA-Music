-- Short-lived, single-use exchange codes for OAuth login.
-- Avoids putting the JWT itself in the redirect URL (server logs, Referer headers).
CREATE TABLE IF NOT EXISTS oauth_login_codes (
    code VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_login_codes_expires_at ON oauth_login_codes(expires_at);

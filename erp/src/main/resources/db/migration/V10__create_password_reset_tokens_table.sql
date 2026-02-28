CREATE TABLE auth.password_reset_tokens (
                                            id UUID PRIMARY KEY,
                                            token VARCHAR(255) NOT NULL UNIQUE,
                                            user_id UUID NOT NULL,
                                            expiry_date TIMESTAMP NOT NULL,
                                            CONSTRAINT fk_password_reset_user_id FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);
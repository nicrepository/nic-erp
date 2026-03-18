CREATE TABLE auth.notifications (
                                    id UUID PRIMARY KEY,
                                    user_id UUID NOT NULL,
                                    title VARCHAR(255) NOT NULL,
                                    message TEXT NOT NULL,
                                    is_read BOOLEAN DEFAULT FALSE,
                                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Liga a notificação ao usuário que vai recebê-la
                                    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
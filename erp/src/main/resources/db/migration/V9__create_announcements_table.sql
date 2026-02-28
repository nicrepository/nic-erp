CREATE TABLE public.announcements (
                                      id UUID PRIMARY KEY,
                                      title VARCHAR(255) NOT NULL,
                                      content TEXT NOT NULL,
                                      image_url VARCHAR(255),
                                      author_id UUID NOT NULL,
                                      created_at TIMESTAMP NOT NULL,
                                      CONSTRAINT fk_announcements_author_id FOREIGN KEY (author_id) REFERENCES auth.users (id) ON DELETE CASCADE
);
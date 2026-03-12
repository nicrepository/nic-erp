CREATE TABLE inventory.it_asset_history (
                                            id UUID PRIMARY KEY,
                                            asset_id UUID NOT NULL,
                                            action VARCHAR(50) NOT NULL,
                                            performed_by UUID NOT NULL,
                                            assigned_to_user UUID,
                                            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

                                            CONSTRAINT fk_it_asset_history_asset FOREIGN KEY (asset_id) REFERENCES inventory.it_assets(id),
                                            CONSTRAINT fk_it_asset_history_performed_by FOREIGN KEY (performed_by) REFERENCES auth.users(id),
                                            CONSTRAINT fk_it_asset_history_assigned_to FOREIGN KEY (assigned_to_user) REFERENCES auth.users(id)
);
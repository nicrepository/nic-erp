INSERT INTO auth.permissions (id, name)
SELECT gen_random_uuid(), permission_name
FROM (
    VALUES
        ('ACCESS_USERS_VIEW'),
        ('ACCESS_USERS_MANAGE'),
        ('ACCESS_ROLES_MANAGE'),
        ('ACCESS_INVENTORY_ADMIN_VIEW'),
        ('ACCESS_INVENTORY_ADMIN_MANAGE'),
        ('ACCESS_INVENTORY_IT_VIEW'),
        ('ACCESS_INVENTORY_IT_MANAGE'),
        ('ACCESS_HR_VIEW'),
        ('ACCESS_HR_MANAGE'),
        ('ACCESS_HELPDESK_VIEW'),
        ('ACCESS_HELPDESK_MANAGE'),
        ('ACCESS_HELPDESK_CATEGORIES_MANAGE')
) AS granular_permissions(permission_name)
WHERE NOT EXISTS (
    SELECT 1
    FROM auth.permissions p
    WHERE p.name = granular_permissions.permission_name
);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'architect'::app_role
FROM auth.users u
WHERE lower(u.email) = 'sdobbs411@yahoo.com'
ON CONFLICT (user_id, role) DO NOTHING;
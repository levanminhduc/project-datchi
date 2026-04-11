UPDATE public.permissions
SET route_path = '/thread/return'
WHERE code = 'thread.issues.return';

NOTIFY pgrst, 'reload schema';


-- 1. Attach the missing auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill profiles for every existing auth user
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id,
       COALESCE(u.email, ''),
       COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3. Mark seeded founder/investor accounts as onboarded
UPDATE public.profiles p
SET role = 'founder', onboarded = true,
    location = COALESCE(p.location, 'San Francisco, CA'),
    bio = COALESCE(NULLIF(p.bio,''), 'Building something useful.')
FROM public.founder_profiles fp WHERE fp.user_id = p.id;

UPDATE public.profiles p
SET role = 'investor', onboarded = true,
    location = COALESCE(p.location, 'New York, NY'),
    bio = COALESCE(NULLIF(p.bio,''), 'Backing exceptional founders early.')
FROM public.investor_profiles ip WHERE ip.user_id = p.id;

UPDATE public.profiles
SET role = 'admin', onboarded = true,
    full_name = COALESCE(NULLIF(full_name,''), 'Admin')
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- 4. Recreate demo conversations + messages (user_a must be < user_b per check constraint)
WITH founders AS (
  SELECT p.id, row_number() OVER (ORDER BY p.created_at) rn
  FROM public.profiles p WHERE p.role = 'founder' LIMIT 10
),
investors AS (
  SELECT p.id, row_number() OVER (ORDER BY p.created_at) rn
  FROM public.profiles p WHERE p.role = 'investor' LIMIT 10
),
pairs AS (
  SELECT LEAST(f.id, i.id) AS user_a,
         GREATEST(f.id, i.id) AS user_b,
         f.id AS founder_id, i.id AS investor_id
  FROM founders f JOIN investors i ON f.rn = i.rn
),
ins_conv AS (
  INSERT INTO public.conversations (user_a, user_b, last_message_at)
  SELECT user_a, user_b, now() FROM pairs
  ON CONFLICT (user_a, user_b) DO NOTHING
  RETURNING id, user_a, user_b
),
conv_with_roles AS (
  SELECT c.id, p.founder_id, p.investor_id
  FROM ins_conv c
  JOIN pairs p ON LEAST(p.founder_id, p.investor_id) = c.user_a
              AND GREATEST(p.founder_id, p.investor_id) = c.user_b
)
INSERT INTO public.messages (conversation_id, sender_id, content, created_at)
SELECT c.id, s.sender_id, s.content, now() - (s.ord || ' minutes')::interval
FROM conv_with_roles c
CROSS JOIN LATERAL (
  VALUES
    (c.founder_id,  'Hey — saw your thesis on Catalyst, would love to share what we''re building.', 4),
    (c.investor_id, 'Happy to chat. What stage are you at and how much are you raising?', 3),
    (c.founder_id,  'Seed, raising $1.5M. Strong design partner traction so far.', 2),
    (c.investor_id, 'Interesting. Send the deck and let''s grab 20 min this week.', 1)
) AS s(sender_id, content, ord);

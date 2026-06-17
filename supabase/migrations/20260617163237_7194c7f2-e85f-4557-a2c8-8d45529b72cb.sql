CREATE OR REPLACE FUNCTION public.validate_conversation_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ra text;
  rb text;
BEGIN
  SELECT role INTO ra FROM public.profiles WHERE id = NEW.user_a;
  SELECT role INTO rb FROM public.profiles WHERE id = NEW.user_b;
  IF ra IS NULL OR rb IS NULL THEN
    RAISE EXCEPTION 'Both users must have a role set';
  END IF;
  IF ra = 'admin' OR rb = 'admin' THEN
    RETURN NEW;
  END IF;
  IF ra = rb THEN
    RAISE EXCEPTION 'Conversations are only allowed between a founder and an investor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_validate_roles ON public.conversations;
CREATE TRIGGER conversations_validate_roles
BEFORE INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.validate_conversation_roles();
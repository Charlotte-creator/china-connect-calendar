
-- Enums
CREATE TYPE meeting_type AS ENUM ('coffee','meal','walk','drinks','activity','flexible');
CREATE TYPE slot_status AS ENUM ('available','booked','blocked');
CREATE TYPE contact_type AS ENUM ('wechat','whatsapp','email','phone','instagram','other');
CREATE TYPE event_visibility AS ENUM ('private','show_time_only','show_people','show_details');
CREATE TYPE join_policy AS ENUM ('not_joinable','request_to_join');
CREATE TYPE event_status AS ENUM ('confirmed','cancelled');
CREATE TYPE location_status AS ENUM ('tbd','suggested','confirmed');
CREATE TYPE participant_role AS ENUM ('host','creator','participant');
CREATE TYPE participant_status AS ENUM ('confirmed','pending','declined');
CREATE TYPE join_request_status AS ENUM ('pending','approved','rejected');
CREATE TYPE todo_status AS ENUM ('open','done');
CREATE TYPE reminder_status AS ENUM ('pending','sent','failed');
CREATE TYPE itinerary_visibility AS ENUM ('public','private');

-- Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  public_slug TEXT NOT NULL UNIQUE DEFAULT lower(substr(md5(random()::text),1,10)),
  host_display_name TEXT NOT NULL DEFAULT 'Charlotte',
  intro_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.trip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  area TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  visibility itinerary_visibility NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  area TEXT,
  location_note TEXT,
  meeting_type meeting_type NOT NULL DEFAULT 'flexible',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status slot_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.host_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_type contact_type NOT NULL,
  contact_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.guest_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  host_question_id UUID NOT NULL REFERENCES public.host_questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  area TEXT,
  exact_location TEXT,
  location_status location_status NOT NULL DEFAULT 'tbd',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  visibility event_visibility NOT NULL DEFAULT 'show_people',
  join_policy join_policy NOT NULL DEFAULT 'not_joinable',
  status event_status NOT NULL DEFAULT 'confirmed',
  created_by_guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  role participant_role NOT NULL DEFAULT 'participant',
  status participant_status NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_join_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_by_guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requesting_guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.event_join_questions(id) ON DELETE SET NULL,
  selected_option CHAR(1),
  is_correct BOOLEAN,
  status join_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status todo_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  kind TEXT NOT NULL DEFAULT '24h',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: is_trip_host
CREATE OR REPLACE FUNCTION public.is_trip_host(_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.trips WHERE id = _trip_id AND host_user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.is_event_trip_host(_event_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.trips t ON t.id = e.trip_id
    WHERE e.id = _event_id AND t.host_user_id = auth.uid()
  )
$$;

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_join_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Trips: host full access; public can SELECT (needed to resolve public_slug -> trip)
CREATE POLICY "host manage trips" ON public.trips FOR ALL TO authenticated
  USING (host_user_id = auth.uid()) WITH CHECK (host_user_id = auth.uid());
CREATE POLICY "public read trips" ON public.trips FOR SELECT TO anon, authenticated USING (true);

-- trip_locations: host manage; public read
CREATE POLICY "host manage trip_locations" ON public.trip_locations FOR ALL TO authenticated
  USING (public.is_trip_host(trip_id)) WITH CHECK (public.is_trip_host(trip_id));
CREATE POLICY "public read trip_locations" ON public.trip_locations FOR SELECT TO anon, authenticated USING (true);

-- availability_slots: host manage; public read
CREATE POLICY "host manage availability_slots" ON public.availability_slots FOR ALL TO authenticated
  USING (public.is_trip_host(trip_id)) WITH CHECK (public.is_trip_host(trip_id));
CREATE POLICY "public read availability_slots" ON public.availability_slots FOR SELECT TO anon, authenticated USING (true);

-- host_questions: host manage; public read (needed to render quiz)
CREATE POLICY "host manage host_questions" ON public.host_questions FOR ALL TO authenticated
  USING (public.is_trip_host(trip_id)) WITH CHECK (public.is_trip_host(trip_id));
CREATE POLICY "public read host_questions" ON public.host_questions FOR SELECT TO anon, authenticated USING (true);

-- guests: anyone may insert (guest signup); host of any related event can read; guest can read own (public read OK for MVP since IDs are uuids)
CREATE POLICY "public insert guests" ON public.guests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public read guests" ON public.guests FOR SELECT TO anon, authenticated USING (true);

-- guest_question_attempts: anyone may insert; host can read for their trip's questions; allow public read (low sensitivity)
CREATE POLICY "public insert attempts" ON public.guest_question_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public read attempts" ON public.guest_question_attempts FOR SELECT TO anon, authenticated USING (true);

-- events: host manage; public read (visibility filtering done in app); anyone may insert (guest booking)
CREATE POLICY "host manage events" ON public.events FOR ALL TO authenticated
  USING (public.is_trip_host(trip_id)) WITH CHECK (public.is_trip_host(trip_id));
CREATE POLICY "public read events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- event_participants: host manage; public read; public insert (when booking)
CREATE POLICY "host manage participants" ON public.event_participants FOR ALL TO authenticated
  USING (public.is_event_trip_host(event_id)) WITH CHECK (public.is_event_trip_host(event_id));
CREATE POLICY "public read participants" ON public.event_participants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert participants" ON public.event_participants FOR INSERT TO anon, authenticated WITH CHECK (true);

-- event_join_questions: anyone may insert (creator); public read; host can manage
CREATE POLICY "host manage join questions" ON public.event_join_questions FOR ALL TO authenticated
  USING (public.is_event_trip_host(event_id)) WITH CHECK (public.is_event_trip_host(event_id));
CREATE POLICY "public read join questions" ON public.event_join_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert join questions" ON public.event_join_questions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- join_requests: anyone may insert; host manage; public read own (for MVP allow public read)
CREATE POLICY "host manage join_requests" ON public.join_requests FOR ALL TO authenticated
  USING (public.is_event_trip_host(event_id)) WITH CHECK (public.is_event_trip_host(event_id));
CREATE POLICY "public read join_requests" ON public.join_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert join_requests" ON public.join_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

-- todos: host only
CREATE POLICY "host manage todos" ON public.todos FOR ALL TO authenticated
  USING (public.is_trip_host(trip_id)) WITH CHECK (public.is_trip_host(trip_id));

-- reminders: host manage; service role used by cron
CREATE POLICY "host manage reminders" ON public.reminders FOR ALL TO authenticated
  USING (public.is_event_trip_host(event_id)) WITH CHECK (public.is_event_trip_host(event_id));

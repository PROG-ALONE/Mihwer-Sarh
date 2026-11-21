create schema if not exists mihwer_private;
revoke all on schema mihwer_private from public, anon, authenticated;

create or replace function mihwer_private.current_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  claim text;
  principal uuid;
begin
  claim := auth.jwt() ->> 'mihwer_user_id';
  if claim is null or claim = '' then
    return null;
  end if;
  principal := claim::uuid;
  if not exists (
    select 1
    from public.mihwer_users u
    where u.id = principal and u.status = 'active' and u.deleted_at is null
  ) then
    return null;
  end if;
  return principal;
exception
  when invalid_text_representation then
    return null;
end;
$$;

revoke all on function mihwer_private.current_user_id() from public, anon;
grant usage on schema mihwer_private to authenticated;
grant execute on function mihwer_private.current_user_id() to authenticated;

create table public.mihwer_users (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active' check (status in ('active', 'disabled', 'deletion_pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id)
);

create table public.sarh_identity_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  issuer text not null check (length(issuer) between 1 and 500),
  subject text not null check (length(subject) between 1 and 500),
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (issuer, subject),
  unique (owner_id, issuer, subject)
);

create table public.user_preferences (
  owner_id uuid primary key references public.mihwer_users(id) on delete restrict,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  time_zone text not null default 'Asia/Riyadh',
  week_starts_on smallint not null default 0 check (week_starts_on between 0 and 6),
  calendar_kind text not null default 'gregorian' check (calendar_kind in ('gregorian', 'hijri')),
  prayer_method text,
  asr_method text check (asr_method in ('standard', 'hanafi')),
  prayer_recording_consent_at timestamptz,
  health_data_consent_at timestamptz,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  time_zone text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id)
);
create unique index journeys_one_active_per_owner on public.journeys(owner_id)
  where status = 'active' and deleted_at is null;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  label text not null check (length(trim(label)) between 1 and 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  time_zone text not null,
  is_default boolean not null default false,
  consented_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (consented_at is not null),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);
create unique index locations_one_default_per_journey on public.locations(owner_id, journey_id)
  where is_default and deleted_at is null;

create table public.paths (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  slug text not null check (length(trim(slug)) between 1 and 80),
  title text not null check (length(trim(title)) between 1 and 160),
  description text,
  sort_order integer not null default 0,
  version integer not null default 1 check (version > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, journey_id, slug),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  path_id uuid,
  title text not null check (length(trim(title)) between 1 and 160),
  description text,
  sort_order integer not null default 0,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict,
  foreign key (owner_id, path_id) references public.paths(owner_id, id) on delete restrict
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  description text,
  start_date date,
  target_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (target_date is null or start_date is null or target_date >= start_date),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 200),
  description text,
  time_horizon text not null check (time_horizon in ('short', 'medium', 'long')),
  start_date date not null,
  target_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (target_date is null or target_date >= start_date)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  station_id uuid,
  project_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  details text,
  task_kind text not null default 'task' check (task_kind in ('task', 'appointment', 'activity')),
  start_date date not null,
  due_date date,
  recurrence_rule text,
  priority smallint not null default 0 check (priority between 0 and 5),
  estimate_minutes integer check (estimate_minutes is null or estimate_minutes between 1 and 10080),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (due_date is null or due_date >= start_date),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict,
  foreign key (owner_id, station_id) references public.stations(owner_id, id) on delete restrict,
  foreign key (owner_id, project_id) references public.projects(owner_id, id) on delete restrict
);

create table public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  task_id uuid not null,
  occurrence_key text not null check (length(occurrence_key) between 1 and 200),
  local_date date not null,
  time_zone text not null,
  start_local_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 10080),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled', 'deferred')),
  completed_at timestamptz,
  actual_minutes integer check (actual_minutes is null or actual_minutes between 0 and 10080),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, task_id, occurrence_key),
  foreign key (owner_id, task_id) references public.tasks(owner_id, id) on delete restrict
);

create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  task_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 200),
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  cancelled_at timestamptz,
  archived_at timestamptz,
  sort_order integer not null default 0,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, task_id) references public.tasks(owner_id, id) on delete restrict
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  path_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  start_date date not null,
  end_date date,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'custom')),
  days smallint[] not null default array[0,1,2,3,4,5,6]::smallint[],
  target numeric(12,2) not null default 1 check (target > 0),
  unit text not null default 'times' check (length(trim(unit)) between 1 and 40),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (end_date is null or end_date >= start_date),
  check (cardinality(days) between 1 and 7),
  check (array_position(days, null) is null),
  check (days <@ array[0,1,2,3,4,5,6]::smallint[]),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict,
  foreign key (owner_id, path_id) references public.paths(owner_id, id) on delete restrict
);

create table public.habit_revisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  habit_id uuid not null,
  effective_date date not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'custom')),
  days smallint[] not null check (cardinality(days) between 1 and 7 and days <@ array[0,1,2,3,4,5,6]::smallint[]),
  target numeric(12,2) not null check (target > 0),
  unit text not null check (length(trim(unit)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, habit_id, effective_date),
  foreign key (owner_id, habit_id) references public.habits(owner_id, id) on delete restrict
);

create table public.habit_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  habit_id uuid not null,
  local_date date not null,
  status text not null check (status in ('completed', 'partial', 'skipped')),
  amount numeric(12,2) check (amount is null or amount >= 0),
  recorded_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  unique (owner_id, id),
  unique (owner_id, habit_id, local_date),
  foreign key (owner_id, habit_id) references public.habits(owner_id, id) on delete restrict
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  project_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 200),
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  sort_order integer not null default 0,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, project_id) references public.projects(owner_id, id) on delete restrict
);

create table public.goal_project_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  goal_id uuid not null,
  project_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, goal_id, project_id),
  foreign key (owner_id, goal_id) references public.goals(owner_id, id) on delete restrict,
  foreign key (owner_id, project_id) references public.projects(owner_id, id) on delete restrict
);
create table public.goal_task_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  goal_id uuid not null,
  task_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, goal_id, task_id),
  foreign key (owner_id, goal_id) references public.goals(owner_id, id) on delete restrict,
  foreign key (owner_id, task_id) references public.tasks(owner_id, id) on delete restrict
);
create table public.goal_habit_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  goal_id uuid not null,
  habit_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, goal_id, habit_id),
  foreign key (owner_id, goal_id) references public.goals(owner_id, id) on delete restrict,
  foreign key (owner_id, habit_id) references public.habits(owner_id, id) on delete restrict
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 200),
  details text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  time_zone text not null,
  all_day_start date,
  all_day_end date,
  recurrence_rule text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (end_at > start_at),
  check ((all_day_start is null and all_day_end is null) or (all_day_start is not null and all_day_end > all_day_start)),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);

create table public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  local_date date not null,
  mood text check (mood is null or mood in ('great', 'good', 'neutral', 'low', 'difficult')),
  note text check (note is null or length(note) <= 5000),
  intention text check (intention is null or length(intention) <= 1000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, journey_id, local_date),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);

create table public.prayer_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  local_date date not null,
  time_zone text not null,
  prayer_key text not null check (prayer_key in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  fard_units smallint not null default 0 check (fard_units between 0 and 20),
  before_units smallint not null default 0 check (before_units between 0 and 20),
  after_units smallint not null default 0 check (after_units between 0 and 20),
  target_fard smallint not null default 2 check (target_fard between 0 and 20),
  target_before smallint not null default 0 check (target_before between 0 and 20),
  target_after smallint not null default 0 check (target_after between 0 and 20),
  recorded_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  unique (owner_id, id),
  unique (owner_id, journey_id, local_date, prayer_key),
  check (fard_units <= target_fard and before_units <= target_before and after_units <= target_after),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);

create table public.study_courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  provider text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);
create table public.study_lessons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  course_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 200),
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, course_id) references public.study_courses(owner_id, id) on delete restrict
);
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  lesson_id uuid,
  started_at timestamptz not null,
  ended_at timestamptz,
  time_zone text not null,
  focus_minutes integer check (focus_minutes is null or focus_minutes between 1 and 10080),
  notes text check (notes is null or length(notes) <= 5000),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  check (ended_at is null or ended_at > started_at),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict,
  foreign key (owner_id, lesson_id) references public.study_lessons(owner_id, id) on delete restrict
);

create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  activity_type text not null check (length(trim(activity_type)) between 1 and 80),
  started_at timestamptz not null,
  ended_at timestamptz,
  time_zone text not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 10080),
  notes text check (notes is null or length(notes) <= 5000),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  check (ended_at is null or ended_at > started_at),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);
create table public.sleep_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  wake_local_date date not null,
  sleep_start_at timestamptz not null,
  wake_at timestamptz not null,
  nap_start_at timestamptz,
  nap_end_at timestamptz,
  time_zone text not null,
  notes text check (notes is null or length(notes) <= 5000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, journey_id, wake_local_date),
  check (wake_at > sleep_start_at),
  check ((nap_start_at is null and nap_end_at is null) or (nap_start_at is not null and nap_end_at > nap_start_at)),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid not null,
  occurred_at timestamptz not null,
  time_zone text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  description text not null check (length(trim(description)) between 1 and 2000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  journey_id uuid,
  kind text not null check (kind in ('note', 'idea', 'link')),
  title text check (title is null or length(title) <= 200),
  body text not null check (length(body) <= 50000),
  url text,
  note_date date,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check ((kind = 'link' and url is not null) or (kind <> 'link')),
  foreign key (owner_id, journey_id) references public.journeys(owner_id, id) on delete restrict
);
create table public.note_goal_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  note_id uuid not null,
  goal_id uuid not null,
  primary key (owner_id, note_id, goal_id),
  foreign key (owner_id, note_id) references public.notes(owner_id, id) on delete restrict,
  foreign key (owner_id, goal_id) references public.goals(owner_id, id) on delete restrict
);
create table public.note_task_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  note_id uuid not null,
  task_id uuid not null,
  primary key (owner_id, note_id, task_id),
  foreign key (owner_id, note_id) references public.notes(owner_id, id) on delete restrict,
  foreign key (owner_id, task_id) references public.tasks(owner_id, id) on delete restrict
);
create table public.note_project_links (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  note_id uuid not null,
  project_id uuid not null,
  primary key (owner_id, note_id, project_id),
  foreign key (owner_id, note_id) references public.notes(owner_id, id) on delete restrict,
  foreign key (owner_id, project_id) references public.projects(owner_id, id) on delete restrict
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  object_key text not null unique,
  content_type text not null,
  byte_size bigint not null check (byte_size between 1 and 20971520),
  checksum text not null,
  state text not null default 'pending' check (state in ('pending', 'ready', 'deleting', 'failed')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id)
);
create table public.attachment_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  attachment_id uuid not null,
  note_id uuid,
  task_id uuid,
  station_id uuid,
  project_id uuid,
  created_at timestamptz not null default now(),
  check (num_nonnulls(note_id, task_id, station_id, project_id) = 1),
  foreign key (owner_id, attachment_id) references public.attachments(owner_id, id) on delete restrict,
  foreign key (owner_id, note_id) references public.notes(owner_id, id) on delete restrict,
  foreign key (owner_id, task_id) references public.tasks(owner_id, id) on delete restrict,
  foreign key (owner_id, station_id) references public.stations(owner_id, id) on delete restrict,
  foreign key (owner_id, project_id) references public.projects(owner_id, id) on delete restrict
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  status text not null default 'active' check (status in ('active', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id)
);
create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  list_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 200),
  quantity text,
  checked_at timestamptz,
  archived_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, list_id) references public.shopping_lists(owner_id, id) on delete restrict
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  cadence text not null check (cadence in ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_date date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id)
);
create table public.subscription_occurrences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  subscription_id uuid not null,
  period_start date not null,
  due_date date not null,
  status text not null default 'due' check (status in ('due', 'paid', 'skipped', 'cancelled')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, subscription_id, period_start),
  foreign key (owner_id, subscription_id) references public.subscriptions(owner_id, id) on delete restrict
);

create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  opening_balance numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id)
);
create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 100),
  transaction_kind text not null check (transaction_kind in ('income', 'expense', 'transfer')),
  archived_at timestamptz,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, name, transaction_kind)
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  period_kind text not null check (period_kind in ('weekly', 'monthly', 'yearly', 'custom')),
  start_date date not null,
  end_date date,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, id),
  check (end_date is null or end_date >= start_date)
);
create table public.budget_category_limits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  budget_id uuid not null,
  category_id uuid not null,
  amount_limit numeric(14,2) not null check (amount_limit > 0),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, budget_id, category_id),
  foreign key (owner_id, budget_id) references public.budgets(owner_id, id) on delete restrict,
  foreign key (owner_id, category_id) references public.finance_categories(owner_id, id) on delete restrict
);
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  account_id uuid not null,
  counter_account_id uuid,
  category_id uuid,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null,
  time_zone text not null,
  shopping_item_id uuid,
  subscription_occurrence_id uuid,
  reversal_of uuid,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  check ((kind = 'transfer' and counter_account_id is not null and category_id is null) or (kind <> 'transfer' and counter_account_id is null)),
  check (counter_account_id is null or counter_account_id <> account_id),
  foreign key (owner_id, account_id) references public.financial_accounts(owner_id, id) on delete restrict,
  foreign key (owner_id, counter_account_id) references public.financial_accounts(owner_id, id) on delete restrict,
  foreign key (owner_id, category_id) references public.finance_categories(owner_id, id) on delete restrict,
  foreign key (owner_id, shopping_item_id) references public.shopping_items(owner_id, id) on delete restrict,
  foreign key (owner_id, subscription_occurrence_id) references public.subscription_occurrences(owner_id, id) on delete restrict,
  foreign key (owner_id, reversal_of) references public.financial_transactions(owner_id, id) on delete restrict
);
create unique index financial_transactions_one_subscription_payment
  on public.financial_transactions(owner_id, subscription_occurrence_id)
  where subscription_occurrence_id is not null;
create unique index financial_transactions_one_shopping_item
  on public.financial_transactions(owner_id, shopping_item_id)
  where shopping_item_id is not null;
create unique index financial_transactions_one_reversal
  on public.financial_transactions(owner_id, reversal_of)
  where reversal_of is not null;

create table public.reminder_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  source_task_occurrence_id uuid,
  source_calendar_event_id uuid,
  channel text not null check (channel in ('in_app', 'push', 'email')),
  offset_minutes integer not null check (offset_minutes between -525600 and 525600),
  enabled boolean not null default false,
  consented_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  check (num_nonnulls(source_task_occurrence_id, source_calendar_event_id) = 1),
  check (not enabled or consented_at is not null),
  foreign key (owner_id, source_task_occurrence_id) references public.task_occurrences(owner_id, id) on delete restrict,
  foreign key (owner_id, source_calendar_event_id) references public.calendar_events(owner_id, id) on delete restrict
);
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  rule_id uuid not null,
  dedupe_key text not null unique,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts smallint not null default 0 check (attempts between 0 and 20),
  last_error_code text,
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, rule_id) references public.reminder_rules(owner_id, id) on delete restrict
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  occurred_at timestamptz not null default now(),
  request_id uuid,
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata) = 'object')
);
create table public.idempotency_keys (
  owner_id uuid not null references public.mihwer_users(id) on delete restrict,
  operation_scope text not null check (length(operation_scope) between 1 and 120),
  idempotency_key uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  result_entity_id uuid,
  result_code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (owner_id, operation_scope, idempotency_key),
  check (expires_at > created_at)
);

create or replace function mihwer_private.touch_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  next_values jsonb;
begin
  next_values := jsonb_build_object('updated_at', now());
  if to_jsonb(new) ? 'version' then
    next_values := next_values || jsonb_build_object(
      'version',
      coalesce((to_jsonb(old) ->> 'version')::integer, 0) + 1
    );
  end if;
  new := jsonb_populate_record(new, next_values);
  return new;
end;
$$;

create or replace function mihwer_private.validate_time_zone()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.time_zone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names z where z.name = new.time_zone
  ) then
    raise exception using errcode = '22023', message = 'invalid_time_zone';
  end if;
  return new;
end;
$$;

create or replace function mihwer_private.append_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entity_owner uuid;
  entity_key uuid;
begin
  if tg_op = 'DELETE' then
    entity_owner := old.owner_id;
    entity_key := old.id;
  else
    entity_owner := new.owner_id;
    entity_key := new.id;
  end if;

  insert into public.audit_events(owner_id, actor_id, entity_type, entity_id, action)
  values (entity_owner, mihwer_private.current_user_id(), tg_table_name, entity_key, lower(tg_op));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function mihwer_private.touch_version() from public, anon, authenticated;
revoke all on function mihwer_private.append_audit_event() from public, anon, authenticated;

do $$
declare
  table_name text;
  mutable_tables text[] := array[
    'user_preferences','journeys','locations','paths','stations','projects','goals','tasks',
    'task_occurrences','task_subtasks','habits','habit_records','project_milestones','calendar_events',
    'daily_reflections','prayer_records','study_courses','study_lessons','sleep_records','meal_logs','notes',
    'shopping_lists','shopping_items','subscriptions','financial_accounts','budgets','reminder_rules',
    'finance_categories','budget_category_limits'
  ];
  all_tables text[] := array[
    'mihwer_users','sarh_identity_links','user_preferences','journeys','locations','paths','stations',
    'projects','goals','tasks','task_occurrences','task_subtasks','habits','habit_revisions','habit_records',
    'project_milestones','goal_project_links','goal_task_links','goal_habit_links','calendar_events',
    'daily_reflections','prayer_records','study_courses','study_lessons','study_sessions','activity_sessions',
    'sleep_records','meal_logs','notes','note_goal_links','note_task_links','note_project_links','attachments',
    'attachment_links','shopping_lists','shopping_items','subscriptions','subscription_occurrences',
    'financial_accounts','finance_categories','budgets','budget_category_limits','financial_transactions',
    'reminder_rules','notification_outbox','audit_events','idempotency_keys'
  ];
  audit_tables text[] := array[
    'journeys','locations','paths','stations','projects','goals','tasks','task_occurrences','task_subtasks',
    'habits','habit_revisions','habit_records','project_milestones','calendar_events','daily_reflections',
    'prayer_records','study_courses','study_lessons','study_sessions','activity_sessions','sleep_records',
    'meal_logs','notes','attachments','attachment_links','shopping_lists','shopping_items','subscriptions',
    'subscription_occurrences','financial_accounts','finance_categories','budgets','budget_category_limits',
    'financial_transactions','reminder_rules','notification_outbox'
  ];
  consent_tables text[] := array['activity_sessions','sleep_records','meal_logs'];
  private_tables text[] := array['sarh_identity_links','notification_outbox','idempotency_keys'];
  read_only_tables text[] := array['attachments','attachment_links','subscription_occurrences','financial_transactions'];
  append_tables text[] := array['habit_revisions','study_sessions'];
  insert_only_tables text[] := array[
    'goal_project_links','goal_task_links','goal_habit_links','note_goal_links','note_task_links','note_project_links'
  ];
  time_zone_tables text[] := array[
    'user_preferences','journeys','locations','task_occurrences','calendar_events','prayer_records',
    'study_sessions','activity_sessions','sleep_records','meal_logs','financial_transactions'
  ];
begin
  foreach table_name in array all_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    if table_name <> 'mihwer_users' and not (table_name = any(private_tables)) then
      execute format('grant select on table public.%I to authenticated', table_name);
    end if;
    if table_name = any(mutable_tables) and table_name <> 'prayer_records' and not (table_name = any(consent_tables)) then
      execute format('grant insert, update, delete on table public.%I to authenticated', table_name);
    elsif table_name = any(append_tables) or table_name = any(insert_only_tables) then
      execute format('grant insert on table public.%I to authenticated', table_name);
    elsif table_name = any(consent_tables) then
      execute format('grant insert, update on table public.%I to authenticated', table_name);
    end if;
    if table_name <> 'mihwer_users'
      and not (table_name = any(private_tables))
      and table_name <> 'prayer_records'
      and not (table_name = any(consent_tables)) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (owner_id = mihwer_private.current_user_id())',
        table_name || '_select_own', table_name
      );
    end if;
    if table_name = any(mutable_tables)
      and table_name <> 'prayer_records'
      and not (table_name = any(consent_tables)) then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (owner_id = mihwer_private.current_user_id())',
        table_name || '_insert_own', table_name
      );
      execute format(
        'create policy %I on public.%I for update to authenticated using (owner_id = mihwer_private.current_user_id()) with check (owner_id = mihwer_private.current_user_id())',
        table_name || '_update_own', table_name
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using (owner_id = mihwer_private.current_user_id())',
        table_name || '_delete_own', table_name
      );
    elsif table_name = any(append_tables) or table_name = any(insert_only_tables) then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (owner_id = mihwer_private.current_user_id())',
        table_name || '_insert_own', table_name
      );
    end if;
  end loop;

  foreach table_name in array mutable_tables loop
    execute format('create trigger %I before update on public.%I for each row execute function mihwer_private.touch_version()', table_name || '_touch_version', table_name);
  end loop;

  foreach table_name in array time_zone_tables loop
    execute format('create trigger %I before insert or update of time_zone on public.%I for each row execute function mihwer_private.validate_time_zone()', table_name || '_validate_time_zone', table_name);
  end loop;

  foreach table_name in array consent_tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id = mihwer_private.current_user_id() and exists (select 1 from public.user_preferences p where p.owner_id = %I.owner_id and p.health_data_consent_at is not null))',
      table_name || '_select_own', table_name, table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (owner_id = mihwer_private.current_user_id() and exists (select 1 from public.user_preferences p where p.owner_id = %I.owner_id and p.health_data_consent_at is not null))',
      table_name || '_insert_own', table_name, table_name
    );
    if table_name = any(mutable_tables) then
      execute format(
        'create policy %I on public.%I for update to authenticated using (owner_id = mihwer_private.current_user_id() and exists (select 1 from public.user_preferences p where p.owner_id = %I.owner_id and p.health_data_consent_at is not null)) with check (owner_id = mihwer_private.current_user_id() and exists (select 1 from public.user_preferences p where p.owner_id = %I.owner_id and p.health_data_consent_at is not null))',
        table_name || '_update_own', table_name, table_name, table_name
      );
    end if;
  end loop;

  foreach table_name in array audit_tables loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function mihwer_private.append_audit_event()', table_name || '_audit', table_name);
  end loop;
end;
$$;

create policy mihwer_users_select_own on public.mihwer_users
  for select to authenticated using (id = mihwer_private.current_user_id() and status = 'active' and deleted_at is null);
grant select on table public.mihwer_users to authenticated;
grant select, insert, update, delete on table public.prayer_records to authenticated;
create policy prayer_records_select_with_consent on public.prayer_records
  for select to authenticated
  using (
    owner_id = mihwer_private.current_user_id()
    and exists (select 1 from public.user_preferences p where p.owner_id = prayer_records.owner_id and p.prayer_recording_consent_at is not null)
  );
create policy prayer_records_insert_with_consent on public.prayer_records
  for insert to authenticated
  with check (
    owner_id = mihwer_private.current_user_id()
    and exists (select 1 from public.user_preferences p where p.owner_id = prayer_records.owner_id and p.prayer_recording_consent_at is not null)
  );
create policy prayer_records_update_with_consent on public.prayer_records
  for update to authenticated
  using (
    owner_id = mihwer_private.current_user_id()
    and exists (select 1 from public.user_preferences p where p.owner_id = prayer_records.owner_id and p.prayer_recording_consent_at is not null)
  )
  with check (
    owner_id = mihwer_private.current_user_id()
    and exists (select 1 from public.user_preferences p where p.owner_id = prayer_records.owner_id and p.prayer_recording_consent_at is not null)
  );

create or replace function public.delete_own_prayer_records()
returns integer
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  deleted_count integer;
begin
  principal := mihwer_private.current_user_id();
  if principal is null then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;
  delete from public.prayer_records where owner_id = principal;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.delete_own_health_records()
returns integer
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  principal uuid;
  deleted_count integer := 0;
  removed integer;
begin
  principal := mihwer_private.current_user_id();
  if principal is null then
    raise exception using errcode = '42501', message = 'unauthenticated';
  end if;
  delete from public.activity_sessions where owner_id = principal;
  get diagnostics removed = row_count;
  deleted_count := deleted_count + removed;
  delete from public.sleep_records where owner_id = principal;
  get diagnostics removed = row_count;
  deleted_count := deleted_count + removed;
  delete from public.meal_logs where owner_id = principal;
  get diagnostics removed = row_count;
  deleted_count := deleted_count + removed;
  return deleted_count;
end;
$$;
revoke all on function public.delete_own_prayer_records() from public, anon;
revoke all on function public.delete_own_health_records() from public, anon;
grant execute on function public.delete_own_prayer_records() to authenticated;
grant execute on function public.delete_own_health_records() to authenticated;

create index journeys_owner_updated on public.journeys(owner_id, updated_at desc);
create index locations_owner_journey on public.locations(owner_id, journey_id);
create index paths_owner_journey_order on public.paths(owner_id, journey_id, sort_order);
create index stations_owner_journey_order on public.stations(owner_id, journey_id, sort_order);
create index tasks_owner_journey_dates on public.tasks(owner_id, journey_id, start_date, due_date) where deleted_at is null;
create index task_occurrences_owner_date on public.task_occurrences(owner_id, local_date, status);
create index task_subtasks_owner_task on public.task_subtasks(owner_id, task_id, sort_order);
create index habits_owner_journey_status on public.habits(owner_id, journey_id, status) where deleted_at is null;
create index habit_records_owner_date on public.habit_records(owner_id, local_date);
create index calendar_events_owner_start on public.calendar_events(owner_id, start_at) where deleted_at is null;
create index reflections_owner_journey_date on public.daily_reflections(owner_id, journey_id, local_date desc);
create index prayer_records_owner_date on public.prayer_records(owner_id, journey_id, local_date);
create index study_sessions_owner_start on public.study_sessions(owner_id, started_at desc);
create index activity_sessions_owner_start on public.activity_sessions(owner_id, started_at desc);
create index sleep_records_owner_date on public.sleep_records(owner_id, wake_local_date desc);
create index meal_logs_owner_occurred on public.meal_logs(owner_id, occurred_at desc) where deleted_at is null;
create index notes_owner_updated on public.notes(owner_id, updated_at desc) where deleted_at is null;
create index shopping_items_owner_list on public.shopping_items(owner_id, list_id, checked_at);
create index subscription_occurrences_owner_due on public.subscription_occurrences(owner_id, due_date, status);
create index transactions_owner_occurred on public.financial_transactions(owner_id, occurred_at desc);
create index budgets_owner_period on public.budgets(owner_id, start_date, end_date) where deleted_at is null;
create index reminders_owner_enabled on public.reminder_rules(owner_id, enabled);
create index outbox_pending_schedule on public.notification_outbox(status, scheduled_at) where status = 'pending';
create index audit_events_owner_occurred on public.audit_events(owner_id, occurred_at desc);

comment on function mihwer_private.current_user_id() is
  'Returns the internal Mihwar principal only from a verified JWT mihwer_user_id claim. Missing or malformed claims fail closed.';
comment on table public.sarh_identity_links is
  'Written only by a trusted identity broker; no direct client grants or policies are created.';
comment on table public.audit_events is
  'Append-only metadata audit trail; never contains row bodies, notes, amounts, coordinates, or tokens.';

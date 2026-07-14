create table if not exists public.user_content_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  preferred_platforms jsonb not null default '[]'::jsonb,
  preferred_formats jsonb not null default '[]'::jsonb,
  weekly_posting_goal integer not null default 3,
  default_platform text not null default 'Instagram',
  content_style_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint user_content_preferences_platforms_array
    check (jsonb_typeof(preferred_platforms) = 'array'),
  constraint user_content_preferences_formats_array
    check (jsonb_typeof(preferred_formats) = 'array'),
  constraint user_content_preferences_weekly_goal
    check (weekly_posting_goal between 1 and 21)
);

drop trigger if exists set_user_content_preferences_updated_at
on public.user_content_preferences;

create trigger set_user_content_preferences_updated_at
before update on public.user_content_preferences
for each row execute function public.set_updated_at();

alter table public.user_content_preferences enable row level security;

drop policy if exists "Users can select own content preferences"
on public.user_content_preferences;
create policy "Users can select own content preferences"
on public.user_content_preferences for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own content preferences"
on public.user_content_preferences;
create policy "Users can insert own content preferences"
on public.user_content_preferences for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own content preferences"
on public.user_content_preferences;
create policy "Users can update own content preferences"
on public.user_content_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own content preferences"
on public.user_content_preferences;
create policy "Users can delete own content preferences"
on public.user_content_preferences for delete
to authenticated
using (auth.uid() = user_id);

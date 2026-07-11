create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  enabled boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_used_at timestamp with time zone,
  unique (user_id, endpoint)
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  calendar_reminders_enabled boolean default true,
  reminder_minutes_before integer default 60,
  workflow_reminders_enabled boolean default true,
  weekly_summary_enabled boolean default false,
  quiet_hours_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  notification_type text not null,
  related_table text,
  related_id uuid,
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone default now(),
  status text default 'sent',
  created_at timestamp with time zone default now(),
  unique (user_id, notification_type, related_id, scheduled_for)
);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_logs enable row level security;

create policy "Users can select own push subscriptions"
on public.push_subscriptions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
on public.push_subscriptions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions"
on public.push_subscriptions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
on public.push_subscriptions for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can select own notification preferences"
on public.notification_preferences for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
on public.notification_preferences for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
on public.notification_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can select own notification logs"
on public.notification_logs for select
to authenticated
using (auth.uid() = user_id);

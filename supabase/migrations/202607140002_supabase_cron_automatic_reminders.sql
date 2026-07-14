alter table public.notification_logs
add column if not exists attempt_count integer not null default 0,
add column if not exists claimed_at timestamp with time zone,
add column if not exists claim_token uuid,
add column if not exists next_retry_at timestamp with time zone,
add column if not exists last_error text,
add column if not exists updated_at timestamp with time zone default now();

update public.notification_logs
set
  sent_at = null,
  attempt_count = greatest(attempt_count, 1),
  next_retry_at = coalesce(next_retry_at, now()),
  updated_at = now()
where status = 'failed';

drop trigger if exists set_notification_logs_updated_at on public.notification_logs;
create trigger set_notification_logs_updated_at
before update on public.notification_logs
for each row execute function public.set_updated_at();

create index if not exists notification_logs_retry_idx
on public.notification_logs (status, next_retry_at)
where status in ('processing', 'failed');

create table if not exists public.notification_scheduler_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  status text not null,
  checked_count integer not null default 0,
  due_count integer not null default 0,
  sent_count integer not null default 0,
  skipped_duplicate_count integer not null default 0,
  upcoming_count integer not null default 0,
  error_message text,
  created_at timestamp with time zone not null default now(),
  constraint notification_scheduler_runs_status
    check (status in ('running', 'success', 'failed'))
);

create index if not exists notification_scheduler_runs_started_at_idx
on public.notification_scheduler_runs (started_at desc);

alter table public.notification_scheduler_runs enable row level security;

create or replace function public.claim_calendar_reminder(
  p_user_id uuid,
  p_related_id uuid,
  p_scheduled_for timestamp with time zone,
  p_claim_token uuid,
  p_max_attempts integer default 3,
  p_stale_after_seconds integer default 300
)
returns table (
  claimed boolean,
  log_id uuid,
  attempt_count integer,
  current_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_row public.notification_logs%rowtype;
  existing_row public.notification_logs%rowtype;
begin
  insert into public.notification_logs (
    user_id,
    notification_type,
    related_table,
    related_id,
    scheduled_for,
    sent_at,
    status,
    attempt_count,
    claimed_at,
    claim_token,
    next_retry_at,
    last_error
  )
  values (
    p_user_id,
    'calendar_reminder',
    'content_calendar',
    p_related_id,
    p_scheduled_for,
    null,
    'processing',
    1,
    now(),
    p_claim_token,
    null,
    null
  )
  on conflict (user_id, notification_type, related_id, scheduled_for)
  do update set
    status = 'processing',
    attempt_count = public.notification_logs.attempt_count + 1,
    claimed_at = now(),
    claim_token = excluded.claim_token,
    next_retry_at = null,
    last_error = null,
    sent_at = null,
    updated_at = now()
  where
    (
      public.notification_logs.status = 'failed'
      and public.notification_logs.attempt_count < greatest(p_max_attempts, 1)
      and (
        public.notification_logs.next_retry_at is null
        or public.notification_logs.next_retry_at <= now()
      )
    )
    or (
      public.notification_logs.status = 'processing'
      and public.notification_logs.attempt_count < greatest(p_max_attempts, 1)
      and public.notification_logs.claimed_at <
        now() - make_interval(secs => greatest(p_stale_after_seconds, 60))
    )
  returning * into claimed_row;

  if claimed_row.id is not null then
    return query select true, claimed_row.id, claimed_row.attempt_count, claimed_row.status;
    return;
  end if;

  select *
  into existing_row
  from public.notification_logs
  where user_id = p_user_id
    and notification_type = 'calendar_reminder'
    and related_id = p_related_id
    and scheduled_for = p_scheduled_for;

  return query select false, existing_row.id, existing_row.attempt_count, existing_row.status;
end;
$$;

revoke all on function public.claim_calendar_reminder(
  uuid,
  uuid,
  timestamp with time zone,
  uuid,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.claim_calendar_reminder(
  uuid,
  uuid,
  timestamp with time zone,
  uuid,
  integer,
  integer
) to service_role;

comment on table public.notification_scheduler_runs is
  'Server-controlled execution history for the automatic reminder scheduler.';

comment on function public.claim_calendar_reminder is
  'Atomically claims one calendar reminder delivery and permits bounded retries for failed or stale claims.';

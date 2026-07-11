alter table public.analytics_entries
add column if not exists content_calendar_id uuid references public.content_calendar(id) on delete set null,
add column if not exists follows_gained integer default 0,
add column if not exists notes text,
add column if not exists updated_at timestamp with time zone default now();

drop trigger if exists set_analytics_entries_updated_at on public.analytics_entries;

create trigger set_analytics_entries_updated_at
before update on public.analytics_entries
for each row execute function public.set_updated_at();

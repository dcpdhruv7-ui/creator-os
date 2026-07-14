-- Run this manually in Supabase SQL Editor after replacing the placeholder.
-- Never commit or paste the real CRON_SECRET into this repository.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  '<PASTE_THE_SAME_CRON_SECRET_CONFIGURED_IN_VERCEL>',
  'creator_os_cron_secret',
  'Bearer secret for the Creator OS automatic reminder endpoint'
);

select cron.schedule(
  'creator-os-calendar-reminders',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://creator-os-ten-phi.vercel.app/api/notifications/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'creator_os_cron_secret'
        limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $job$
);

-- Verify the job exists:
select jobid, jobname, schedule, active
from cron.job
where jobname = 'creator-os-calendar-reminders';

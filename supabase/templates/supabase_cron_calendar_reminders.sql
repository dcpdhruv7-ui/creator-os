-- Make a private copy, replace YOUR_CRON_SECRET_HERE, and run it in Supabase SQL Editor.
-- Never save or commit the filled version to this repository.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'creator-os-calendar-reminders';

select cron.schedule(
  'creator-os-calendar-reminders',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://creator-os-ten-phi.vercel.app/api/notifications/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
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

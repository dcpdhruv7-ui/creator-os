# Supabase Cron Setup

Creator OS uses Supabase Cron to call its protected reminder endpoint once per minute. This runs independently of the website and browser, so the Creator OS tab can be closed.

## Before You Start

1. Apply `supabase/migrations/202607140002_supabase_cron_automatic_reminders.sql` in Supabase SQL Editor.
2. Confirm these Vercel **Production** environment variables are configured:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `CREATOR_OS_TIME_ZONE` (optional; defaults to `Asia/Kolkata`)
3. Redeploy after changing Vercel environment variables.

Never commit `CRON_SECRET`, the VAPID private key, or the Supabase service-role key.

## 1. Enable Cron And HTTP

In Supabase, open **Database > Extensions** and enable:

- `pg_cron` (also shown as the Cron integration)
- `pg_net`

These can also be enabled by the placeholder SQL template. Vault is not required.

## 2. Create A Secret

Generate a long random value locally. One Windows PowerShell option is:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated value to Vercel as `CRON_SECRET` for Production. Use the same value only in the private SQL copy you run in Supabase. Do not add the filled SQL to `.env.example`, a migration, GitHub, or chat.

## 3. Create The Minute Job

Open `supabase/templates/supabase_cron_calendar_reminders.sql`, replace only:

```text
YOUR_CRON_SECRET_HERE
```

Then run it once in **Supabase > SQL Editor**. It creates a job named `creator-os-calendar-reminders` with schedule `* * * * *` and sends:

```text
POST https://creator-os-ten-phi.vercel.app/api/notifications/cron
Authorization: Bearer <CRON_SECRET>
```

The secret is stored in the private cron command inside your Supabase project and is not placed in the request URL. Limit access to the SQL Editor and `cron.job`, and never commit the filled template.

If the job name already exists, remove it before creating it again:

```sql
select cron.unschedule('creator-os-calendar-reminders');
```

## 4. Inspect Scheduler Health

Check the configured job:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'creator-os-calendar-reminders';
```

Check recent pg_cron executions:

```sql
select jobid, status, return_message, start_time, end_time
from cron.job_run_details
order by start_time desc
limit 25;
```

Check recent HTTP responses from `pg_net`:

```sql
select id, status_code, error_msg, created
from net._http_response
order by created desc
limit 25;
```

Check application-level scheduler results:

```sql
select status, checked_count, due_count, sent_count,
       skipped_duplicate_count, upcoming_count, started_at, completed_at
from public.notification_scheduler_runs
order by started_at desc
limit 25;
```

Creator OS Settings also reports **Active**, **Delayed**, **Never run**, or **Last run failed**. Active means a successful run completed within the last three minutes.

## 5. Test The Endpoint Manually

Use an environment variable so the secret does not appear in the command itself:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod -Method Post -Uri "https://creator-os-ten-phi.vercel.app/api/notifications/cron" -Headers $headers
```

An invalid or missing Bearer token returns HTTP 401. A valid run returns structured counts including `checked`, `due`, `sent`, `skippedDuplicates`, and `upcoming`.

## 6. Disable Or Remove The Job

Temporarily disable it:

```sql
update cron.job
set active = false
where jobname = 'creator-os-calendar-reminders';
```

Enable it again:

```sql
update cron.job
set active = true
where jobname = 'creator-os-calendar-reminders';
```

Remove it completely:

```sql
select cron.unschedule('creator-os-calendar-reminders');
```

The application retains the latest 1,000 scheduler run records. For manual cleanup:

```sql
delete from public.notification_scheduler_runs
where id in (
  select id
  from public.notification_scheduler_runs
  order by started_at desc
  offset 1000
);
```

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text,
  avatar_url text,
  primary_niche text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table public.sub_niches (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid references public.niches(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid references public.niches(id) on delete cascade,
  sub_niche_id uuid references public.sub_niches(id) on delete set null,
  name text not null,
  platform text,
  style text,
  content_strength text,
  hook_style text,
  editing_style text,
  posting_style text,
  audience_type text,
  learnings text,
  created_at timestamp with time zone default now()
);

create table public.user_creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  niche text,
  sub_niche text,
  selected_creators jsonb,
  energy_style text,
  content_tone text,
  editing_style text,
  caption_style text,
  best_formats jsonb,
  posting_frequency text,
  growth_angle text,
  personal_brand_direction text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  niche text,
  sub_niche text,
  hook text,
  format text,
  shot_list text,
  caption_angle text,
  difficulty text,
  goal text,
  status text default 'Idea',
  priority text default 'Medium',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.captions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content_idea_id uuid references public.content_ideas(id) on delete cascade,
  caption_type text,
  hook text,
  body text,
  cta text,
  hashtags text,
  created_at timestamp with time zone default now()
);

create table public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content_idea_id uuid references public.content_ideas(id) on delete set null,
  title text not null,
  platform text,
  scheduled_date date,
  scheduled_time time,
  status text default 'Scheduled',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.analytics_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content_idea_id uuid references public.content_ideas(id) on delete set null,
  platform text,
  post_title text,
  niche text,
  sub_niche text,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  reach integer default 0,
  posted_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_user_creator_profiles_updated_at
before update on public.user_creator_profiles
for each row execute function public.set_updated_at();

create trigger set_content_ideas_updated_at
before update on public.content_ideas
for each row execute function public.set_updated_at();

create trigger set_content_calendar_updated_at
before update on public.content_calendar
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.niches enable row level security;
alter table public.sub_niches enable row level security;
alter table public.creators enable row level security;
alter table public.user_creator_profiles enable row level security;
alter table public.content_ideas enable row level security;
alter table public.captions enable row level security;
alter table public.content_calendar enable row level security;
alter table public.analytics_entries enable row level security;

create policy "Users can select own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can delete own profile"
on public.profiles for delete
to authenticated
using (auth.uid() = id);

create policy "Authenticated users can read niches"
on public.niches for select
to authenticated
using (true);

create policy "Authenticated users can read sub niches"
on public.sub_niches for select
to authenticated
using (true);

create policy "Authenticated users can read creators"
on public.creators for select
to authenticated
using (true);

create policy "Users can select own creator profiles"
on public.user_creator_profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own creator profiles"
on public.user_creator_profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own creator profiles"
on public.user_creator_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own creator profiles"
on public.user_creator_profiles for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can select own content ideas"
on public.content_ideas for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own content ideas"
on public.content_ideas for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own content ideas"
on public.content_ideas for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own content ideas"
on public.content_ideas for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can select own captions"
on public.captions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own captions"
on public.captions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own captions"
on public.captions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own captions"
on public.captions for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can select own content calendar"
on public.content_calendar for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own content calendar"
on public.content_calendar for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own content calendar"
on public.content_calendar for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own content calendar"
on public.content_calendar for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can select own analytics entries"
on public.analytics_entries for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own analytics entries"
on public.analytics_entries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own analytics entries"
on public.analytics_entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own analytics entries"
on public.analytics_entries for delete
to authenticated
using (auth.uid() = user_id);

insert into public.niches (name, description)
values
  ('Dance', 'Movement-led content across performance, teaching, and short-form choreography.'),
  ('Fitness', 'Training, motivation, education, and transformation content.'),
  ('Self-Improvement', 'Habits, mindset, productivity, confidence, and personal growth.'),
  ('Comedy', 'Relatable sketches, observations, characters, and social humor.'),
  ('Fashion', 'Style inspiration, outfits, trends, wardrobe education, and personal style.'),
  ('Food', 'Recipes, food discovery, kitchen education, and taste-led storytelling.'),
  ('Education', 'Teaching, explainers, frameworks, study support, and skill-building.'),
  ('Gaming', 'Gameplay, commentary, tutorials, challenges, and community-led content.');

insert into public.sub_niches (niche_id, name, description)
select niches.id, sub_niche.name, sub_niche.description
from public.niches
join (
  values
    ('Dance', 'Hip-hop', 'Rhythm, musicality, choreographies, and performance clips.'),
    ('Dance', 'Krump', 'High-energy expression, battle culture, and movement breakdowns.'),
    ('Dance', 'Bollywood', 'Film-inspired routines, expressions, and festive choreography.'),
    ('Dance', 'Freestyle', 'Improvised movement, personal style, and trend interpretation.'),
    ('Dance', 'Contemporary', 'Emotion-led movement, storytelling, and technique.'),
    ('Dance', 'Tutorials', 'Step-by-step teaching, beginner support, and move breakdowns.'),
    ('Dance', 'Dance Fitness', 'Workout routines built around music and movement.'),
    ('Fitness', 'Gym Motivation', 'Training discipline, mindset, and workout momentum.'),
    ('Fitness', 'Bodybuilding', 'Hypertrophy, splits, form, nutrition, and progress.'),
    ('Fitness', 'Fat Loss', 'Sustainable fat-loss education, habits, and meal guidance.'),
    ('Fitness', 'Calisthenics', 'Bodyweight strength, skills, progressions, and mobility.'),
    ('Fitness', 'Transformation Journey', 'Personal progress, accountability, and milestones.'),
    ('Fitness', 'Fitness Education', 'Evidence-informed training and nutrition explainers.'),
    ('Self-Improvement', 'Productivity', 'Systems, routines, focus, and better daily execution.'),
    ('Self-Improvement', 'Mindset', 'Confidence, discipline, reflection, and identity change.'),
    ('Comedy', 'Relatable Sketches', 'Everyday situations turned into quick comedic scenes.'),
    ('Fashion', 'Outfit Ideas', 'Wearable looks, styling prompts, and occasion-based dressing.'),
    ('Food', 'Quick Recipes', 'Easy, repeatable meals and snack ideas.'),
    ('Education', 'Explainers', 'Clear breakdowns of complex ideas for learners.'),
    ('Gaming', 'Gameplay Commentary', 'Personality-led gameplay, reactions, and community clips.')
) as sub_niche(niche_name, name, description) on niches.name = sub_niche.niche_name;

insert into public.creators (
  niche_id,
  sub_niche_id,
  name,
  platform,
  style,
  content_strength,
  hook_style,
  editing_style,
  posting_style,
  audience_type,
  learnings
)
select
  niches.id,
  sub_niches.id,
  creator.name,
  creator.platform,
  creator.style,
  creator.content_strength,
  creator.hook_style,
  creator.editing_style,
  creator.posting_style,
  creator.audience_type,
  creator.learnings
from (
  values
    ('Dance', 'Hip-hop', 'High-Energy Dance Educator', 'Short-form video', 'Tutorial plus performance', 'Clear move breakdowns', 'Start with the finished move', 'Fast cuts with beat drops', 'Daily drills and weekly routines', 'Beginner to intermediate dancers', 'Teach one move, then show the full combo.'),
    ('Dance', 'Freestyle', 'Freestyle Story Performer', 'Short-form video', 'Expressive freestyle', 'Emotional movement storytelling', 'Open with a mood or prompt', 'Smooth cuts and close-up moments', 'Performance clips with occasional notes', 'Fans of expressive dance', 'Use personal prompts to make movement feel memorable.'),
    ('Fitness', 'Gym Motivation', 'No-Excuses Training Coach', 'Short-form video', 'Motivational training', 'High-energy gym clips', 'Lead with a challenge', 'Punchy cuts and rep close-ups', 'Workout clips and motivational captions', 'Busy lifters and beginners', 'Pair simple routines with strong emotional reasons.'),
    ('Fitness', 'Fitness Education', 'Evidence-Based Fitness Guide', 'Short-form video', 'Calm educational', 'Simple training explanations', 'Ask a common mistake question', 'Clean captions and diagrams', 'Educational carousels and clips', 'Learners who want clarity', 'Debunk one myth per post with a practical fix.'),
    ('Self-Improvement', 'Productivity', 'Quiet Systems Mentor', 'Short-form video', 'Reflective and practical', 'Actionable routines', 'Name a relatable friction point', 'Minimal cuts and text overlays', 'Daily prompts and weekly frameworks', 'Creators and students', 'Turn abstract advice into tiny repeatable actions.'),
    ('Self-Improvement', 'Mindset', 'Identity Growth Coach', 'Short-form video', 'Warm coaching', 'Reframes and confidence prompts', 'Open with a self-talk line', 'Soft pacing with strong captions', 'Reflection posts and talking-head clips', 'Personal growth audience', 'Make the viewer feel seen before giving the tactic.'),
    ('Comedy', 'Relatable Sketches', 'Everyday Sketch Creator', 'Short-form video', 'Character-led comedy', 'Fast relatable setups', 'Start with the awkward moment', 'Quick cuts and reaction zooms', 'Frequent sketches around daily life', 'Young social audiences', 'One strong observation can carry an entire sketch.'),
    ('Comedy', 'Relatable Sketches', 'Office Humor Writer', 'Short-form video', 'Situational comedy', 'Workplace and social jokes', 'Lead with a familiar phrase', 'Simple jump cuts', 'Recurring characters and scenarios', 'Working professionals', 'Recurring formats make jokes easier to recognize.'),
    ('Fashion', 'Outfit Ideas', 'Capsule Style Curator', 'Short-form video', 'Polished styling', 'Outfit formulas', 'Show the final look first', 'Clean transitions and fit checks', 'Outfit ideas and wardrobe tips', 'Style-conscious beginners', 'Build trust through repeatable outfit formulas.'),
    ('Fashion', 'Outfit Ideas', 'Streetwear Fit Builder', 'Short-form video', 'Trend-aware styling', 'Layering and silhouettes', 'Ask which piece to style', 'Music-led transitions', 'Fit checks and item breakdowns', 'Streetwear fans', 'Anchor every look around one statement piece.'),
    ('Food', 'Quick Recipes', 'Five-Minute Recipe Friend', 'Short-form video', 'Friendly practical cooking', 'Simple repeatable recipes', 'Lead with the finished bite', 'Overhead prep and quick cuts', 'Fast recipes and shopping tips', 'Busy home cooks', 'Keep recipes visual and low-friction.'),
    ('Food', 'Quick Recipes', 'Flavor Explorer', 'Short-form video', 'Taste-led discovery', 'Food reviews and quick recipes', 'Open with a texture or taste claim', 'Close-ups and natural sound', 'Discovery posts and recipe tests', 'Food-curious audiences', 'Sensory details make food content more watchable.'),
    ('Education', 'Explainers', 'Simple Explainer Teacher', 'Short-form video', 'Clear educational', 'Complex ideas made simple', 'Start with what people misunderstand', 'Text-led pacing and examples', 'Explainers and mini lessons', 'Students and curious learners', 'Use one idea, one example, one takeaway.'),
    ('Education', 'Explainers', 'Exam Prep Coach', 'Short-form video', 'Structured teaching', 'Study frameworks', 'Promise a faster way to understand', 'Slides plus talking head', 'Daily lessons and revision prompts', 'Students', 'Practical templates help learners apply advice quickly.'),
    ('Gaming', 'Gameplay Commentary', 'Challenge Run Gamer', 'Short-form video', 'High-energy gameplay', 'Challenge formats', 'State the impossible challenge first', 'Fast highlight cuts', 'Challenge clips and progress updates', 'Gaming communities', 'Clear stakes make gameplay easier to follow.'),
    ('Gaming', 'Gameplay Commentary', 'Calm Strategy Player', 'Short-form video', 'Thoughtful commentary', 'Tactical breakdowns', 'Show the mistake before the fix', 'Gameplay clips with captions', 'Tips and match analysis', 'Players who want to improve', 'Explain decisions, not just outcomes.')
) as creator(
  niche_name,
  sub_niche_name,
  name,
  platform,
  style,
  content_strength,
  hook_style,
  editing_style,
  posting_style,
  audience_type,
  learnings
)
join public.niches on niches.name = creator.niche_name
left join public.sub_niches on sub_niches.niche_id = niches.id and sub_niches.name = creator.sub_niche_name;

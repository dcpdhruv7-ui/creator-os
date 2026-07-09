begin;

create temporary table day_2_niches (
  name text primary key,
  description text not null
) on commit drop;

insert into day_2_niches (name, description)
values
  ('Comedy', 'Relatable humor, character-led sketches, observations, and entertaining social moments.'),
  ('Dance', 'Performance, choreography, teaching, expression, and movement-led short-form content.'),
  ('Education', 'Clear teaching, explainers, frameworks, study support, and practical skill building.'),
  ('Fashion', 'Wearable style, grooming, trends, wardrobe education, and personal expression.'),
  ('Fitness', 'Training, strength, mobility, nutrition, education, and transformation content.'),
  ('Food', 'Recipes, meal planning, food discovery, reviews, and home-cooking stories.'),
  ('Gaming', 'Gameplay, commentary, competitive gaming, tutorials, and community entertainment.'),
  ('Self-Improvement', 'Habits, mindset, productivity, confidence, and intentional personal growth.'),
  ('Cinematography', 'Visual storytelling, camera work, lighting, edits, and cinematic content creation.'),
  ('Animation', 'Animated storytelling, motion design, character content, explainers, and creative visual content.'),
  ('AI & Technology', 'AI tools, coding, automation, apps, and technology-led creator content.'),
  ('Content Creation', 'Creator strategy, personal branding, growth systems, hooks, planning, and content workflow.');

update public.niches as niche
set description = desired.description
from day_2_niches as desired
where lower(niche.name) = lower(desired.name);

insert into public.niches (name, description)
select desired.name, desired.description
from day_2_niches as desired
where not exists (
  select 1
  from public.niches as niche
  where lower(niche.name) = lower(desired.name)
);

create temporary table day_2_sub_niches (
  niche_name text not null,
  name text not null,
  description text not null,
  primary key (niche_name, name)
) on commit drop;

insert into day_2_sub_niches (niche_name, name, description)
values
  ('Comedy', 'Relatable Sketches', 'Everyday experiences turned into recognizable short sketches.'),
  ('Comedy', 'Character Comedy', 'Recurring personalities, voices, and character-driven jokes.'),
  ('Comedy', 'POV Comedy', 'First-person scenarios that place the viewer inside the joke.'),
  ('Comedy', 'Observational Comedy', 'Funny takes on familiar behaviors, habits, and social moments.'),
  ('Comedy', 'Trending Audio Comedy', 'Comedy concepts planned around popular audio formats.'),
  ('Comedy', 'Situational Humor', 'Humor built from specific social, work, family, or daily-life situations.'),

  ('Dance', 'Bollywood', 'Film-inspired routines, expressions, and festive choreography.'),
  ('Dance', 'Hip-hop', 'Rhythm, musicality, choreography, and performance-led clips.'),
  ('Dance', 'Contemporary', 'Emotion-led movement, storytelling, and technique.'),
  ('Dance', 'Freestyle', 'Improvised movement, musical interpretation, and personal style.'),
  ('Dance', 'Dance Fitness', 'Workout routines built around music and movement.'),
  ('Dance', 'Tutorials', 'Step-by-step teaching, beginner support, and move breakdowns.'),
  ('Dance', 'Trending Reels', 'Dance concepts planned for current short-form formats.'),
  ('Dance', 'Choreography', 'Original routines, combinations, and performance sequencing.'),
  ('Dance', 'Expressions', 'Facial expression, emotion, and performance detail.'),
  ('Dance', 'Dance Challenges', 'Repeatable routines and participation-led dance formats.'),
  ('Dance', 'Behind the Scenes', 'Practice, rehearsals, mistakes, and the process behind a performance.'),

  ('Education', 'Explainers', 'Clear breakdowns that make complex ideas easier to understand.'),
  ('Education', 'Tutorials', 'Step-by-step lessons that help viewers complete a task.'),
  ('Education', 'Study Tips', 'Learning methods, revision habits, and exam preparation.'),
  ('Education', 'Skill Building', 'Practical lessons that develop a specific capability over time.'),
  ('Education', 'Career Guidance', 'Role insights, career decisions, applications, and professional growth.'),
  ('Education', 'Case Studies', 'Real or illustrative examples used to teach a larger lesson.'),
  ('Education', 'Frameworks', 'Repeatable models, checklists, and systems for solving problems.'),

  ('Fashion', 'Outfit Ideas', 'Wearable looks, styling prompts, and occasion-based dressing.'),
  ('Fashion', 'Hairstyling Tips', 'Practical hair styling, care, and look-completion guidance.'),
  ('Fashion', 'Occasion Wear', 'Looks designed for work, celebrations, events, and special moments.'),
  ('Fashion', 'Budget Fashion', 'Accessible styling, smart shopping, and affordable outfit building.'),
  ('Fashion', 'Grooming & Personal Style', 'Grooming routines and choices that shape a distinct personal image.'),
  ('Fashion', 'Fashion Trends', 'Planning and interpretation of seasonal or platform-led style trends.'),
  ('Fashion', 'Wardrobe Essentials', 'Core pieces, capsule wardrobes, and repeatable outfit foundations.'),
  ('Fashion', 'Color Combinations', 'Color pairing, contrast, coordination, and palette guidance.'),

  ('Fitness', 'Gym Motivation', 'Training discipline, mindset, consistency, and workout momentum.'),
  ('Fitness', 'Bodybuilding', 'Hypertrophy, training splits, physique development, and progress.'),
  ('Fitness', 'Transformation Journey', 'Personal progress, accountability, lessons, and milestones.'),
  ('Fitness', 'Fitness Education', 'Evidence-informed training and nutrition explanations.'),
  ('Fitness', 'Bodyweight Training', 'Strength, control, and progressions using minimal equipment.'),
  ('Fitness', 'Strength Training', 'Progressive resistance, compound lifts, and strength development.'),
  ('Fitness', 'Mobility & Flexibility', 'Movement quality, range of motion, recovery, and flexibility.'),
  ('Fitness', 'Beginner Fitness', 'Approachable routines, fundamentals, and confidence for new trainees.'),
  ('Fitness', 'Workout Routines', 'Structured sessions, exercise combinations, and weekly programming.'),
  ('Fitness', 'Form Correction', 'Technique breakdowns, common mistakes, and safer movement cues.'),
  ('Fitness', 'Nutrition', 'Practical nutrition education that supports training and wellbeing.'),

  ('Food', 'Quick Recipes', 'Fast, repeatable meals and snack ideas.'),
  ('Food', 'High-Protein Meals', 'Protein-focused meals for fitness, fullness, and practical nutrition.'),
  ('Food', 'Vegetarian Meals', 'Plant-forward meal ideas without meat or fish.'),
  ('Food', 'Non-Vegetarian Meals', 'Recipes featuring meat, poultry, fish, or eggs.'),
  ('Food', 'Diet Food', 'Goal-aware meals designed around specific dietary preferences.'),
  ('Food', 'Weight Loss Meals', 'Satisfying meals planned around sustainable calorie awareness.'),
  ('Food', 'Budget Meals', 'Affordable recipes, smart shopping, and low-waste cooking.'),
  ('Food', 'Meal Prep', 'Batch cooking, storage, planning, and ready-ahead meals.'),
  ('Food', 'Healthy Snacks', 'Simple snack ideas with practical nutritional value.'),
  ('Food', 'Restaurant Reviews', 'Dining experiences, dish reviews, value, and recommendations.'),
  ('Food', 'Home Cooking', 'Comforting, practical recipes made in an everyday kitchen.'),

  ('Gaming', 'Valorant', 'Matches, agents, tactics, highlights, and community content.'),
  ('Gaming', 'BGMI / PUBG Mobile', 'Mobile battle royale gameplay, tactics, and highlights.'),
  ('Gaming', 'Minecraft', 'Building, survival, challenges, tutorials, and creative play.'),
  ('Gaming', 'Esports', 'Competitive play, tournaments, teams, analysis, and reactions.'),
  ('Gaming', 'Tips & Tricks', 'Actionable techniques that help players improve.'),
  ('Gaming', 'Gameplay Commentary', 'Personality-led playthroughs, reactions, and match narration.'),
  ('Gaming', 'Funny Clips', 'Unexpected, entertaining, and highly shareable gameplay moments.'),
  ('Gaming', 'Trending Games', 'Planning content around games receiving increased creator attention.'),

  ('Self-Improvement', 'Mindset', 'Beliefs, reframes, discipline, and identity-led growth.'),
  ('Self-Improvement', 'Productivity', 'Systems, routines, focus, and better daily execution.'),
  ('Self-Improvement', 'Habit Building', 'Starting, tracking, and sustaining useful behaviors.'),
  ('Self-Improvement', 'Morning Routine', 'Intentional ways to structure and improve the start of the day.'),
  ('Self-Improvement', 'Confidence Building', 'Practical exercises, reflection, and stronger self-belief.'),
  ('Self-Improvement', 'Self-Improvement Journey', 'Honest progress updates, lessons, and personal experiments.'),
  ('Self-Improvement', 'Deep Work', 'Distraction reduction, focused practice, and meaningful output.'),
  ('Self-Improvement', 'Journaling', 'Reflection prompts, writing practices, and self-awareness.'),
  ('Self-Improvement', 'Goal Tracking', 'Planning, measurement, reviews, and progress accountability.'),
  ('Self-Improvement', 'Motivation', 'Encouragement, momentum, discipline, and action-oriented perspective.'),
  ('Self-Improvement', 'Book Summaries', 'Useful ideas and lessons distilled from books.'),

  ('Cinematography', 'Mobile Cinematography', 'Cinematic shooting techniques designed for smartphones.'),
  ('Cinematography', 'Camera Movements', 'Pans, tilts, tracking, handheld movement, and motivated camera motion.'),
  ('Cinematography', 'Lighting', 'Natural and artificial lighting setups, control, and mood.'),
  ('Cinematography', 'Color Grading', 'Color correction, looks, mood, and finishing workflows.'),
  ('Cinematography', 'Reel Transitions', 'In-camera and editing transitions for short-form videos.'),
  ('Cinematography', 'Behind the Scenes', 'Setups, equipment, process, and production decisions.'),
  ('Cinematography', 'Storytelling Shots', 'Shot choices that communicate emotion, context, and progression.'),
  ('Cinematography', 'Product Cinematography', 'Commercial-looking visuals for products and brands.'),
  ('Cinematography', 'Travel Cinematics', 'Location-led visual stories, sequences, and atmospheric edits.'),
  ('Cinematography', 'Editing Breakdown', 'Timelines, pacing, sound, cuts, and post-production decisions.'),

  ('Animation', '2D Animation', 'Illustrated movement, frame-based animation, and 2D storytelling.'),
  ('Animation', '3D Animation', 'Modeling, motion, lighting, and rendered three-dimensional scenes.'),
  ('Animation', 'Motion Graphics', 'Animated typography, shapes, graphics, and visual systems.'),
  ('Animation', 'Character Animation', 'Performance, expression, acting, and movement for characters.'),
  ('Animation', 'Animated Explainers', 'Animation used to clarify products, processes, and ideas.'),
  ('Animation', 'VFX', 'Compositing, effects, tracking, and enhanced live-action visuals.'),

  ('AI & Technology', 'AI Tools', 'Practical demonstrations and comparisons of AI-powered tools.'),
  ('AI & Technology', 'ChatGPT', 'Prompts, workflows, use cases, and responsible ChatGPT guidance.'),
  ('AI & Technology', 'Coding', 'Programming concepts, projects, debugging, and developer learning.'),
  ('AI & Technology', 'Automation', 'Systems that reduce repetitive digital work.'),
  ('AI & Technology', 'Productivity Apps', 'Apps and workflows that improve organization and output.'),
  ('AI & Technology', 'Websites', 'Website building, design, optimization, and useful web products.'),
  ('AI & Technology', 'App Development', 'Planning, building, testing, and shipping applications.'),
  ('AI & Technology', 'No-Code', 'Building digital products and workflows without traditional programming.'),
  ('AI & Technology', 'Tech Reviews', 'Useful reviews, comparisons, and buying considerations for technology.'),
  ('AI & Technology', 'AI Workflows', 'Connected AI processes for research, creation, and operations.'),

  ('Content Creation', 'Reels Strategy', 'Short-form concepts, structure, retention, and publishing direction.'),
  ('Content Creation', 'Hook Writing', 'Opening lines and visual setups designed to earn attention.'),
  ('Content Creation', 'Caption Strategy', 'Captions that add context, voice, value, and calls to action.'),
  ('Content Creation', 'Content Planning', 'Editorial systems, calendars, pillars, and sustainable workflows.'),
  ('Content Creation', 'Personal Branding', 'Positioning, identity, trust, and recognizable creator direction.'),
  ('Content Creation', 'Editing Workflow', 'Repeatable editing systems, organization, and production efficiency.'),
  ('Content Creation', 'Trend Adaptation', 'Adapting trend formats to fit a creator niche and voice.'),
  ('Content Creation', 'Creator Journey', 'Progress, lessons, experiments, and honest behind-the-scenes growth.'),
  ('Content Creation', 'Behind the Scenes', 'The process, decisions, and work behind published content.'),
  ('Content Creation', 'Social Media Growth', 'Audience development, consistency, learning loops, and distribution.'),
  ('Content Creation', 'Storytelling Formats', 'Repeatable narrative structures for educational and entertaining content.');

update public.sub_niches as sub_niche
set description = desired.description
from public.niches as niche,
     day_2_sub_niches as desired
where sub_niche.niche_id = niche.id
  and lower(niche.name) = lower(desired.niche_name)
  and lower(sub_niche.name) = lower(desired.name);

insert into public.sub_niches (niche_id, name, description)
select niche.id, desired.name, desired.description
from day_2_sub_niches as desired
join public.niches as niche
  on lower(niche.name) = lower(desired.niche_name)
where not exists (
  select 1
  from public.sub_niches as sub_niche
  where sub_niche.niche_id = niche.id
    and lower(sub_niche.name) = lower(desired.name)
);

delete from public.sub_niches as sub_niche
using public.niches as niche
where sub_niche.niche_id = niche.id
  and exists (
    select 1
    from day_2_niches as desired_niche
    where lower(desired_niche.name) = lower(niche.name)
  )
  and not exists (
    select 1
    from day_2_sub_niches as desired_sub_niche
    where lower(desired_sub_niche.niche_name) = lower(niche.name)
      and lower(desired_sub_niche.name) = lower(sub_niche.name)
  );

commit;

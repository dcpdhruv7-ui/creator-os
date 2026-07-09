begin;

create temporary table day_3_creators (
  niche_name text not null,
  sub_niche_name text not null,
  name text not null,
  platform text not null,
  style text not null,
  content_strength text not null,
  hook_style text not null,
  editing_style text not null,
  posting_style text not null,
  audience_type text not null,
  learnings text not null,
  primary key (niche_name, name)
) on commit drop;

insert into day_3_creators
  (niche_name, sub_niche_name, name, platform, style, content_strength, hook_style, editing_style, posting_style, audience_type, learnings)
values
  ('Comedy', 'Relatable Sketches', 'Relatable Sketch Creator', 'Short-form video', 'Everyday sketch comedy', 'Recognizable situations', 'Open with a familiar frustration', 'Quick cuts and reaction beats', 'Recurring weekly sketch formats', 'Young professionals and students', 'Turn one sharp observation into a repeatable series.'),
  ('Comedy', 'Character Comedy', 'Character Comedy Performer', 'Short-form video', 'Recurring character comedy', 'Memorable personalities', 'Enter in character immediately', 'Jump cuts and costume cues', 'Character episodes and callbacks', 'Comedy-first social audiences', 'Build recognition through consistent characters and catchphrases.'),
  ('Comedy', 'POV Comedy', 'POV Humor Creator', 'Short-form video', 'Viewer-led POV comedy', 'Fast situational setups', 'Start with a specific POV label', 'Text-led cuts and close reactions', 'Frequent short scenarios', 'Highly social short-form viewers', 'Specific situations make POV humor more shareable.'),
  ('Comedy', 'Observational Comedy', 'Observational Humor Writer', 'Video and text', 'Dry observational comedy', 'Sharp social insights', 'State the behavior everyone notices', 'Minimal cuts with deliberate pauses', 'Topical observations and monologues', 'Viewers who enjoy clever humor', 'A precise truth can be stronger than an elaborate setup.'),

  ('Dance', 'Bollywood', 'Bollywood Performance Creator', 'Short-form video', 'Expressive Bollywood performance', 'Performance and expressions', 'Show the strongest move first', 'Beat-matched cuts and wide shots', 'Performance reels and routines', 'Dance and entertainment audiences', 'Pair clear expressions with a memorable movement moment.'),
  ('Dance', 'Tutorials', 'Dance Tutorial Educator', 'Short-form video', 'Step-by-step dance teaching', 'Clear movement breakdowns', 'Preview the finished combination', 'Slow-motion steps and labeled counts', 'Tutorial series and practice clips', 'Beginner and intermediate dancers', 'Show the outcome, teach in chunks, then repeat at full speed.'),
  ('Dance', 'Freestyle', 'Freestyle Story Performer', 'Short-form video', 'Emotion-led freestyle', 'Musical storytelling', 'Begin with a mood or prompt', 'Smooth cuts and close details', 'Freestyle studies and performance clips', 'Expressive dance audiences', 'Use a clear emotion to make improvised movement memorable.'),
  ('Dance', 'Trending Reels', 'Dance Trend Adapter', 'Short-form video', 'Trend-aware dance concepts', 'Fast format adaptation', 'Lead with the recognizable format', 'Punchy beat cuts and loops', 'Timely reels adapted to one style', 'Short-form dance viewers', 'Adapt the format to your identity instead of copying it unchanged.'),

  ('Education', 'Explainers', 'Simple Explainer Educator', 'Video and carousel', 'Clear visual education', 'Complex ideas made simple', 'Start with a common misunderstanding', 'Clean captions and visual examples', 'Mini lessons and explainers', 'Students and curious learners', 'Teach one idea with one example and one takeaway.'),
  ('Education', 'Tutorials', 'Practical Tutorial Teacher', 'Video and carousel', 'Outcome-led tutorials', 'Actionable step sequences', 'Promise a specific result', 'Screen captures and numbered steps', 'Searchable evergreen tutorials', 'Skill-building audiences', 'Remove friction by showing each action in order.'),
  ('Education', 'Study Tips', 'Study Systems Coach', 'Short-form video', 'Practical study guidance', 'Useful learning systems', 'Name the study problem first', 'Talking head with concise overlays', 'Study experiments and templates', 'Students and exam learners', 'Pair every tip with a method the viewer can try today.'),
  ('Education', 'Case Studies', 'Case Study Storyteller', 'Video and carousel', 'Narrative case-study teaching', 'Evidence and real examples', 'Open with the surprising outcome', 'Timeline edits and annotated visuals', 'Weekly breakdowns and lessons', 'Professionals and advanced learners', 'Use a clear before, decision, result, and lesson structure.'),

  ('Fashion', 'Outfit Ideas', 'Streetwear Style Creator', 'Short-form video', 'Streetwear outfit building', 'Layering and silhouettes', 'Show the finished fit first', 'Clean transitions and fit checks', 'Outfit formulas and item breakdowns', 'Style-conscious young adults', 'Anchor each look around one recognizable styling decision.'),
  ('Fashion', 'Wardrobe Essentials', 'Capsule Wardrobe Curator', 'Video and carousel', 'Minimal wardrobe education', 'Repeatable outfit systems', 'Ask how many looks one item can make', 'Polished cuts and labeled pieces', 'Capsule series and wardrobe guides', 'Practical fashion beginners', 'Teach versatility instead of only displaying individual looks.'),
  ('Fashion', 'Budget Fashion', 'Budget Style Builder', 'Short-form video', 'Accessible fashion guidance', 'Value and smart shopping', 'Lead with the total outfit cost', 'Price overlays and quick comparisons', 'Budget finds and styling challenges', 'Value-conscious style audiences', 'Make affordability part of the creative constraint.'),
  ('Fashion', 'Grooming & Personal Style', 'Personal Style Mentor', 'Video and carousel', 'Identity-led personal styling', 'Grooming and style clarity', 'Name the image the viewer wants', 'Calm talking head and visual examples', 'Style audits and practical guides', 'People refining their personal image', 'Connect clothing and grooming choices to a clear identity.'),

  ('Fitness', 'Gym Motivation', 'Cinematic Fitness Storyteller', 'Short-form video', 'Motivational training stories', 'Emotion and discipline', 'Open on the hardest moment', 'Cinematic pacing and impact cuts', 'Training stories and progress updates', 'Busy beginners and gym audiences', 'Give workout footage a story with stakes and progress.'),
  ('Fitness', 'Fitness Education', 'Evidence-Based Fitness Educator', 'Video and carousel', 'Calm fitness education', 'Clear training explanations', 'Challenge a common gym mistake', 'Clean diagrams and exercise demos', 'Myth checks and technique lessons', 'Learners seeking reliable guidance', 'Explain why the advice works, then show the practical fix.'),
  ('Fitness', 'Workout Routines', 'Workout Routine Coach', 'Short-form video', 'Follow-along workout programming', 'Structured usable routines', 'State the goal and time required', 'Exercise labels and timer cuts', 'Saveable routines and weekly plans', 'People who need ready-made workouts', 'Make routines easy to save, follow, and repeat.'),
  ('Fitness', 'Form Correction', 'Movement Form Coach', 'Short-form video', 'Technique correction', 'Visual before-and-after cues', 'Show the mistake before the fix', 'Side-by-side demonstrations', 'Single-exercise correction series', 'Beginner and intermediate trainees', 'One visible correction per post keeps instruction clear.'),

  ('Food', 'High-Protein Meals', 'High-Protein Meal Creator', 'Short-form video', 'Practical protein-focused cooking', 'Simple nutritious meals', 'Lead with protein and final result', 'Overhead prep and macro overlays', 'Repeatable recipes and meal prep', 'Fitness and busy food audiences', 'Combine appetite appeal with useful nutrition context.'),
  ('Food', 'Quick Recipes', 'Quick Recipe Creator', 'Short-form video', 'Fast home cooking', 'Low-friction recipes', 'Show the finished bite first', 'Tight overhead cuts and captions', 'Fast recipes and ingredient swaps', 'Busy home cooks', 'Reduce ingredients and steps without losing visual payoff.'),
  ('Food', 'Restaurant Reviews', 'Honest Food Reviewer', 'Short-form video', 'Direct restaurant reviews', 'Taste, value, and specificity', 'Lead with the strongest verdict', 'Close-ups and natural sound', 'Focused reviews and comparisons', 'Local food explorers', 'Explain who the dish is for, not only whether you liked it.'),
  ('Food', 'Meal Prep', 'Meal Prep Systems Creator', 'Video and carousel', 'Organized batch cooking', 'Planning and efficiency', 'Show the full week of meals', 'Process cuts and storage labels', 'Weekly prep systems and shopping lists', 'Busy people planning meals', 'Turn cooking into a reusable system with clear quantities.'),

  ('Gaming', 'Valorant', 'Valorant Clip Creator', 'Short-form video', 'High-energy tactical highlights', 'Clutch moments and decisions', 'Show the impossible situation first', 'Fast highlight cuts and captions', 'Clips, reactions, and tactical notes', 'Valorant players and esports fans', 'Make the decision behind the play as clear as the result.'),
  ('Gaming', 'BGMI / PUBG Mobile', 'Mobile Battle Royale Creator', 'Short-form video', 'Mobile competitive gameplay', 'Clutches and practical tactics', 'Open with the final-circle stakes', 'Punchy gameplay cuts and callouts', 'Match highlights and tips', 'Mobile battle royale players', 'Clear stakes help viewers follow even a very short clip.'),
  ('Gaming', 'Tips & Tricks', 'Gaming Improvement Coach', 'Video and carousel', 'Practical game education', 'Actionable skill improvement', 'Show the mistake before the technique', 'Annotated gameplay and zooms', 'Single-tip lessons and drills', 'Players trying to improve', 'Teach decisions and repeatable habits, not isolated tricks.'),
  ('Gaming', 'Funny Clips', 'Gaming Comedy Editor', 'Short-form video', 'Personality-led funny moments', 'Timing and reactions', 'Start just before the unexpected moment', 'Comedic captions and reaction cuts', 'Frequent clips and compilations', 'Casual gaming audiences', 'Editing rhythm can turn an ordinary moment into a joke.'),

  ('Self-Improvement', 'Mindset', 'Mindset Reflection Coach', 'Video and carousel', 'Warm reflective coaching', 'Useful reframes', 'Open with familiar self-talk', 'Calm pacing and strong captions', 'Reflections and practical prompts', 'Personal growth audiences', 'Make the viewer feel understood before offering the reframe.'),
  ('Self-Improvement', 'Productivity', 'Productivity Systems Creator', 'Video and carousel', 'Practical systems thinking', 'Repeatable workflows', 'Name the friction in a daily task', 'Minimal edits and screen examples', 'Frameworks, templates, and reviews', 'Creators, students, and professionals', 'Turn broad advice into a system the viewer can repeat.'),
  ('Self-Improvement', 'Habit Building', 'Habit Journey Creator', 'Short-form video', 'Honest progress documentation', 'Consistency and accountability', 'Start with the current streak or setback', 'Diary clips and simple progress graphics', 'Daily check-ins and weekly lessons', 'People building better routines', 'Visible progress and setbacks create trust.'),
  ('Self-Improvement', 'Book Summaries', 'Practical Book Ideas Creator', 'Video and carousel', 'Applied book summaries', 'Useful ideas without filler', 'Lead with the idea worth remembering', 'Text-led pacing and simple visuals', 'Book lessons and application prompts', 'Readers and lifelong learners', 'Translate each idea into one real action.'),

  ('Cinematography', 'Mobile Cinematography', 'Mobile Cinematography Creator', 'Short-form video', 'Phone-shot cinematic education', 'Accessible visual quality', 'Show the final shot before the setup', 'Before-and-after edits and overlays', 'Shot tutorials and setup reveals', 'Mobile creators and filmmakers', 'A strong comparison makes technical advice instantly useful.'),
  ('Cinematography', 'Lighting', 'Cinematic Lighting Educator', 'Short-form video', 'Lighting breakdowns', 'Mood and visual control', 'Reveal the scene before and after lighting', 'Split screens and setup diagrams', 'Lighting recipes and scene studies', 'Filmmakers and visual creators', 'Teach what each light changes, not only where it sits.'),
  ('Cinematography', 'Storytelling Shots', 'Visual Storytelling Director', 'Short-form video', 'Narrative shot design', 'Emotion and visual sequencing', 'Open with the story question', 'Cinematic sequences and restrained text', 'Shot studies and mini visual stories', 'Filmmakers and brand creators', 'Every shot should reveal information or change emotion.'),
  ('Cinematography', 'Editing Breakdown', 'Cinematic Edit Breakdowns', 'Video and carousel', 'Post-production education', 'Pacing and edit decisions', 'Play the finished sequence first', 'Timeline captures and annotated cuts', 'Edit breakdowns and workflow lessons', 'Editors and video creators', 'Explain why each cut exists, not just which tool made it.'),

  ('Animation', '2D Animation', '2D Story Animation Creator', 'Short-form video', 'Illustrated visual storytelling', 'Simple expressive narratives', 'Start with the emotional change', 'Frame-by-frame sequences and process cuts', 'Short stories and process reveals', 'Animation and art audiences', 'Clear poses and timing can carry a simple story.'),
  ('Animation', '3D Animation', '3D Visual Creator', 'Short-form video', 'Stylized 3D scenes', 'Polished visual spectacle', 'Reveal the final render immediately', 'Render transitions and process layers', 'Render showcases and breakdowns', 'Designers and 3D learners', 'Pair visual payoff with one understandable process insight.'),
  ('Animation', 'Motion Graphics', 'Motion Design Explainer', 'Video and carousel', 'Graphic motion education', 'Clarity through movement', 'Animate the key idea in the opening', 'Rhythmic type and shape animation', 'Design studies and tutorials', 'Designers and brand creators', 'Motion should guide attention before it adds decoration.'),
  ('Animation', 'Character Animation', 'Character Performance Animator', 'Short-form video', 'Character acting and expression', 'Personality through movement', 'Open on the strongest pose or reaction', 'Pose comparisons and timing breakdowns', 'Acting studies and character clips', 'Animators and storytelling audiences', 'Readable intention makes a character feel alive.'),

  ('AI & Technology', 'AI Tools', 'AI Tools Educator', 'Video and carousel', 'Practical AI demonstrations', 'Useful workflows and comparisons', 'Lead with the task the tool solves', 'Screen captures and concise callouts', 'Tool demos and workflow tests', 'Creators and knowledge workers', 'Show the input, process, and useful output without hype.'),
  ('AI & Technology', 'ChatGPT', 'ChatGPT Workflow Creator', 'Video and carousel', 'Prompt and workflow education', 'Clear practical use cases', 'Start with the weak result before the improved prompt', 'Screen recordings and prompt highlights', 'Prompt lessons and workflow series', 'Professionals and creators', 'Teach the thinking behind a prompt, not only the words.'),
  ('AI & Technology', 'Coding', 'Build-in-Public Coding Educator', 'Video and carousel', 'Project-led coding education', 'Real building and debugging', 'Show the feature before the code', 'Screen capture with focused zooms', 'Build logs and compact tutorials', 'Beginner and intermediate developers', 'A visible outcome gives technical detail a reason to matter.'),
  ('AI & Technology', 'AI Workflows', 'AI Automation Strategist', 'Video and carousel', 'Connected AI systems', 'Time-saving process design', 'Quantify the repetitive task first', 'Workflow maps and screen demos', 'System breakdowns and templates', 'Operators, creators, and founders', 'Make automation understandable as a sequence of clear handoffs.'),

  ('Content Creation', 'Reels Strategy', 'Short-Form Strategy Creator', 'Video and carousel', 'Retention-led content strategy', 'Strong structure and positioning', 'Diagnose why a reel loses attention', 'Examples, timelines, and overlays', 'Audits and repeatable frameworks', 'Creators growing short-form channels', 'Teach structure through specific examples instead of vague advice.'),
  ('Content Creation', 'Hook Writing', 'Hook Writing Coach', 'Video and carousel', 'Opening-line education', 'Clear attention mechanics', 'Compare a weak hook with a stronger one', 'Large text and quick examples', 'Hook rewrites and swipe files', 'Creators and personal brands', 'A good rewrite explains the curiosity or relevance it creates.'),
  ('Content Creation', 'Personal Branding', 'Personal Brand Strategist', 'Video and carousel', 'Positioning-led creator education', 'Clarity and recognizable identity', 'Ask what the creator should be known for', 'Calm talking head and frameworks', 'Positioning audits and brand prompts', 'Coaches, educators, and creators', 'Consistency starts with a clear promise, audience, and point of view.'),
  ('Content Creation', 'Behind the Scenes', 'Creator Journey Documenter', 'Short-form video', 'Transparent build-in-public content', 'Process and honest lessons', 'Open with the decision or setback', 'Diary clips and process footage', 'Progress updates and retrospectives', 'Aspiring and active creators', 'Showing the process creates connection before polished results arrive.');

update public.creators as creator
set
  sub_niche_id = sub_niche.id,
  platform = desired.platform,
  style = desired.style,
  content_strength = desired.content_strength,
  hook_style = desired.hook_style,
  editing_style = desired.editing_style,
  posting_style = desired.posting_style,
  audience_type = desired.audience_type,
  learnings = desired.learnings
from public.niches as niche,
     public.sub_niches as sub_niche,
     day_3_creators as desired
where creator.niche_id = niche.id
  and sub_niche.niche_id = niche.id
  and lower(niche.name) = lower(desired.niche_name)
  and lower(sub_niche.name) = lower(desired.sub_niche_name)
  and lower(creator.name) = lower(desired.name);

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
  niche.id,
  sub_niche.id,
  desired.name,
  desired.platform,
  desired.style,
  desired.content_strength,
  desired.hook_style,
  desired.editing_style,
  desired.posting_style,
  desired.audience_type,
  desired.learnings
from day_3_creators as desired
join public.niches as niche
  on lower(niche.name) = lower(desired.niche_name)
join public.sub_niches as sub_niche
  on sub_niche.niche_id = niche.id
  and lower(sub_niche.name) = lower(desired.sub_niche_name)
where not exists (
  select 1
  from public.creators as creator
  where creator.niche_id = niche.id
    and lower(creator.name) = lower(desired.name)
);

delete from public.creators as creator
using public.niches as niche
where creator.niche_id = niche.id
  and exists (
    select 1
    from day_3_creators as desired_niche
    where lower(desired_niche.niche_name) = lower(niche.name)
  )
  and not exists (
    select 1
    from day_3_creators as desired
    where lower(desired.niche_name) = lower(niche.name)
      and lower(desired.name) = lower(creator.name)
  );

commit;

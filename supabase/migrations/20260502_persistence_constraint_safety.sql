-- Keep production writes aligned with the app's red, green, and partner case paths.
-- This migration is intentionally narrow: it normalizes only constrained enum-like
-- columns that are currently used by Passage persistence flows.

update public.tasks
set category = 'personal'
where category is null
   or category not in (
    'notifications',
    'property',
    'legal',
    'government',
    'financial',
    'personal',
    'memorial',
    'digital',
    'service',
    'logistics',
    'medical'
  );

alter table public.tasks
  alter column category set default 'personal';

alter table public.tasks
  alter column funeral_home_eligible set default false;

alter table public.tasks
  drop constraint if exists tasks_category_check;

alter table public.tasks
  add constraint tasks_category_check
  check (category in (
    'notifications',
    'property',
    'legal',
    'government',
    'financial',
    'personal',
    'memorial',
    'digital',
    'service',
    'logistics',
    'medical'
  ));

update public.workflows
set path = case
    when path in ('green', 'planning') or mode in ('green', 'planning') then 'green'
    else 'red'
  end
where path is null or path not in ('red', 'green');

update public.workflows
set mode = case
    when mode in ('green', 'planning') or path = 'green' then 'green'
    else 'red'
  end
where mode is null or mode not in ('red', 'green');

update public.workflows
set setup_stage = case
    when path = 'green' then 'ready'
    else 'active'
  end
where setup_stage is null or setup_stage not in ('active', 'ready');

alter table public.workflows
  alter column path set default 'red';

alter table public.workflows
  alter column mode set default 'red';

alter table public.workflows
  alter column setup_stage set default 'active';

alter table public.workflows
  alter column trigger_type set default 'death_confirmed';

alter table public.workflows
  drop constraint if exists workflows_path_check;

alter table public.workflows
  add constraint workflows_path_check
  check (path in ('red', 'green'));

alter table public.workflows
  drop constraint if exists workflows_mode_check;

alter table public.workflows
  add constraint workflows_mode_check
  check (mode in ('red', 'green'));

alter table public.workflows
  drop constraint if exists workflows_setup_stage_check;

alter table public.workflows
  add constraint workflows_setup_stage_check
  check (setup_stage in ('active', 'ready'));

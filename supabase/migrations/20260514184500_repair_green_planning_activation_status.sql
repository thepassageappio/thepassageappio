-- Planning records should not appear activated until the activation circle
-- completes two-person confirmation.

update public.workflows
set activation_status = 'ready',
    updated_at = now()
where coalesce(path, mode) = 'green'
  and activation_status = 'activated'
  and coalesce(status, '') not in ('triggered', 'active', 'coordination_active', 'urgent_first_steps_generated', 'completed', 'archived');

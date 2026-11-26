begin;

create function public.save_client_workout(
  p_workout_id uuid,
  p_client_id uuid,
  p_recorded_at timestamptz,
  p_note text,
  p_sets jsonb
)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_inserted uuid;
  v_pt_id uuid;
begin
  select pt_id into v_pt_id from public.clients
    where id = p_client_id and user_id = auth.uid()
      and status = 'active' and archived_at is null;
  if not found then
    raise exception 'Workout permission denied' using errcode = '42501';
  end if;

  if p_workout_id is null or p_recorded_at is null or not isfinite(p_recorded_at)
    or length(p_note) > 1000 or jsonb_typeof(p_sets) is distinct from 'array' then
    raise exception 'Invalid workout' using errcode = '22023';
  end if;
  if jsonb_array_length(p_sets) not between 1 and 100 then
    raise exception 'Invalid number of sets' using errcode = '22023';
  end if;

  insert into public.workout_logs (id, client_id, started_at, ended_at, note)
    values (p_workout_id, p_client_id, p_recorded_at, p_recorded_at, nullif(btrim(p_note), ''))
    on conflict (id) do nothing returning id into v_inserted;
  if v_inserted is null then
    if exists (select 1 from public.workout_logs
      where id = p_workout_id and client_id = p_client_id and created_by = auth.uid()) then
      return p_workout_id;
    end if;
    raise exception 'Workout permission denied' using errcode = '42501';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_sets) as s(exercise_id uuid, weight_kg numeric, reps integer)
    left join public.exercises e on e.id = s.exercise_id and e.is_active and (e.pt_id is null or e.pt_id = v_pt_id)
    where e.id is null or s.weight_kg is null or s.weight_kg not between 0 and 9999.99
      or round(s.weight_kg, 2) <> s.weight_kg or s.reps is null or s.reps not between 1 and 9999
  ) then
    raise exception 'Invalid workout set' using errcode = '22023';
  end if;
  insert into public.workout_sets (workout_log_id, exercise_id, set_number, weight_kg, reps)
    select p_workout_id, s.exercise_id, s.position::integer, s.weight_kg, s.reps
    from rows from (jsonb_to_recordset(p_sets) as (exercise_id uuid, weight_kg numeric, reps integer))
      with ordinality as s(exercise_id, weight_kg, reps, position);
  return p_workout_id;
end $$;

revoke execute on function public.save_client_workout(uuid, uuid, timestamptz, text, jsonb)
  from public, anon;
grant execute on function public.save_client_workout(uuid, uuid, timestamptz, text, jsonb)
  to authenticated;

commit;

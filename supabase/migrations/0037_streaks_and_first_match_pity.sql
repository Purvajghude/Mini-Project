-- Retention: daily streaks + first-match pity.
--
-- Streaks: touch_streak() is called once per app open; consecutive days grow
-- the streak, a gap resets it to 1. The client shows the count and celebrates
-- milestones; premium cosmetics can gate on it.
--
-- Pity: a brand-new user's first right-swipe on a demo profile always matches
-- (like-back 100% while they have zero matches, then the usual 30%). Nobody
-- should install the app and not feel the match moment in their first session.

alter table profiles
  add column if not exists streak_days int not null default 0,
  add column if not exists last_seen_date date;

create or replace function touch_streak()
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  me uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  last date;
  days int;
  extended boolean := false;
begin
  select last_seen_date, streak_days into last, days from profiles where id = me;
  if days is null then
    days := 0;
  end if;
  if last is distinct from today then
    if last = today - 1 then
      days := days + 1;
    else
      days := 1;
    end if;
    extended := true;
    update profiles set streak_days = days, last_seen_date = today where id = me;
  end if;
  return jsonb_build_object('streak', days, 'extended', extended);
end;
$$;

revoke execute on function touch_streak() from anon;

create or replace function record_swipe(
  p_target uuid,
  p_direction swipe_direction,
  p_time_ms integer default null
)
returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  me uuid := auth.uid();
  reciprocal boolean := false;
  is_demo boolean;
  has_any_match boolean;
  v_match uuid;
begin
  insert into swipes (swiper_id, target_id, direction, time_spent_ms)
  values (me, p_target, p_direction, p_time_ms)
  on conflict (swiper_id, target_id)
    do update set direction = excluded.direction, time_spent_ms = excluded.time_spent_ms;

  if p_direction in ('right', 'up') then
    select exists (
      select 1 from swipes
      where swiper_id = p_target and target_id = me and direction in ('right', 'up')
    ) into reciprocal;

    if not reciprocal then
      select exists (
        select 1 from auth.users where id = p_target and email like '%@mesh.demo'
      ) into is_demo;
      if is_demo then
        select exists (
          select 1 from matches where me in (user_a, user_b)
        ) into has_any_match;
        -- Pity: guarantee the first match; 30% like-back afterwards.
        if (not has_any_match) or random() < 0.3 then
          insert into swipes (swiper_id, target_id, direction)
          values (p_target, me, 'right')
          on conflict (swiper_id, target_id) do nothing;
          reciprocal := true;
        end if;
      end if;
    end if;

    if reciprocal then
      insert into matches (user_a, user_b)
      values (least(me, p_target), greatest(me, p_target))
      on conflict (user_a, user_b) do nothing;
      select id into v_match from matches
      where user_a = least(me, p_target) and user_b = greatest(me, p_target);
      return jsonb_build_object('matched', true, 'match_id', v_match);
    end if;
  end if;

  return jsonb_build_object('matched', false);
end;
$$;

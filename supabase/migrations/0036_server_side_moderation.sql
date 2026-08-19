-- Server-side moderation: every new feed post is moderated by the backend via
-- a DB trigger — not by the author's client (which a modified client simply
-- wouldn't call). Required posture for a Play Store app with UGC.
--
-- Follows the 0032 pg_net pattern: URL in app_config, shared secret in
-- app_config.notify_secret (inserted out-of-band, never in git). The client's
-- fire-and-forget /feed/moderate call still works and is idempotent with this.

insert into app_config (key, value)
values ('moderate_url', 'https://mesh-ai-backend.onrender.com/internal/moderate')
on conflict (key) do update set value = excluded.value;

create or replace function moderate_on_post()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_url text; v_secret text;
begin
  select value into v_url    from app_config where key = 'moderate_url';
  select value into v_secret from app_config where key = 'notify_secret';
  if v_url is null then return new; end if;  -- not configured yet → no-op

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object('post_id', new.id)
  );
  return new;
end;
$$;

-- Not client-callable (trigger-only), matching 0035's posture.
revoke execute on function public.moderate_on_post() from anon, authenticated;

drop trigger if exists moderate_post on feed_posts;
create trigger moderate_post after insert on feed_posts
  for each row execute function moderate_on_post();

-- Advisor quick wins: trigger functions must not be callable via PostgREST RPC.
-- Triggers execute as the table owner regardless of EXECUTE grants, so this
-- only removes the unintended /rest/v1/rpc/ exposure.
revoke execute on function public.notify_on_comment() from anon, authenticated;
revoke execute on function public.notify_on_new_ask() from anon, authenticated;

-- is_blocked is an app helper for signed-in users only.
revoke execute on function public.is_blocked(uuid) from anon;

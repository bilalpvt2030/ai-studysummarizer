-- Lets a signed-in user delete their own account without the app holding the
-- service role key. Runs with the owner's rights, but can only ever remove the
-- caller's own row; summaries and usage rows go with it (on delete cascade).
create function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

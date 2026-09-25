# Switching on optional sync

Sync ships **off**. With no project configured, no account is required and no learning
data leaves the browser. The deployed site still sends cookie-free, anonymous page-view
counts to Vercel Web Analytics. Signing in never unlocks a feature — it only copies a
progress record between a person's own devices.

Three steps, about ten minutes.

## 1. Create the Supabase project

supabase.com → new project (free tier). From **Project Settings → API** copy:

- the **Project URL**
- the **anon public** key — it is safe in client code; the policies below are what protect rows

## 2. Run this SQL once

Supabase → **SQL Editor** → paste → Run.

```sql
create table if not exists public.sync (
  user_id    uuid primary key references auth.users on delete cascade,
  body       text not null,
  updated_at timestamptz not null default now()
);

alter table public.sync enable row level security;

-- A signed-in person can see and write their own row, and no other.
create policy "own row read"   on public.sync for select using (auth.uid() = user_id);
create policy "own row write"  on public.sync for insert with check (auth.uid() = user_id);
create policy "own row update" on public.sync for update using (auth.uid() = user_id);

-- Delete account and synced data. The row goes with the user (on delete cascade).
create or replace function public.delete_me() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
```

Then **Authentication → URL Configuration** → set Site URL to `https://dryruncs.com`
and add it to Redirect URLs, so sign-in links come back to the right place.

## 3. Paste the two strings into `index.html`

Search for `SYNC_CONFIG`:

```js
const SYNC_CONFIG = { url:'https://xxxx.supabase.co', anonKey:'eyJhbGci…' };
```

That is the whole switch. Non-empty values make the **Sync across devices** panel appear
in Progress, and make the sync paragraph appear in About → Your data. Both are held to the
same state by a self-test, so sync can never be offered without saying what it sends.

## How merging works

`Sync now` pulls the stored copy, hands it to `store.importJSON`, then pushes the result
back. `importJSON` already merges: it keeps the attempts from both sides and drops
duplicates by timestamp. A revision session done on a phone is never overwritten by a
laptop that syncs afterwards.

## Counting anonymous visitors

Signed-in accounts are counted in the Supabase dashboard. For everyone else, see the
commented Cloudflare Web Analytics block at the bottom of `index.html` — one token, no
cookies, no consent banner.

## What it means for the offline promise

| State | Network |
|---|---|
| Sync not configured | None after load, ever |
| Configured, signed out | None after load — the sign-in library is fetched only when someone asks to sign in |
| Signed in | The progress record and the email address, to the project above, and nothing else |

The About → Your data page states all three. Keep it true if you change any of this.

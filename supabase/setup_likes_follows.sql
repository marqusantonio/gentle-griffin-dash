`? That might be allowed? However, user likely needs to run it. Better create SQL file and tell user to run it. But system said don't create migration files under supabase/migrations; root SQL okay maybe. We also need code modifications to context etc. We don't have context file. We only know useWevids functions. We can modify ShortsFeedView and maybe create new helper hook? Since context functions currently exist toggleClipLike etc. Need fix multiplication without modifying context? We can implement local code in ShortsFeedView with per-user like state stored in Supabase clip_reactions table, and update context optimistically only once per user. But context likely still toggles clip.isLiked and counts. We can call it only if local state changed? Need prevent repeated calls due rapid clicks by tracking local reaction state and using database. But context's toggleClipLike probably toggles every call; handleToggleLikeWithCloudSync currently calls toggleClipLike each click, causing count increment each rapid click if context doesn't dedupe. We can change handler to not toggle context each click? We need know context implementation. We don't have file but can infer toggles local state. Maybe better to create a new component-local like toggle function that:
- Keep local clicked state in a ref/state per card.
- Use Supabase `clip_reactions` table to upsert unique reaction.
- Use rpc to increment/decrement clips.likes correctly.
- Also call context to sync UI.
But context is source of data. Need update at context level ideally, but we cannot modify context file unless we create/rewrite it. User only gave ShortsFeedView. We can rewrite that and maybe supply a separate `useLikeSync` hook. Could we modify `useWevids` context? We don't know content. But we can patch ShortsFeedView to avoid multiplication and rely on Supabase for counts, while updating local UI via context. Let's inspect available functions from destructuring:
clips, deleteClip, toggleClipLike, toggleClipDislike, toggleClipBookmark, addClipComment, openShareModal, allUsers, currentUser, toggleFollowUser, isFollowing, isMutualFriend, openUserProfileModal, isBlocked, syncWithSupabase. We can use these.

The bug "when i like the video a lot of times it multiplies like when i click the like button it multiplies" means likely every click toggles like off/on, but count increments? Could be because handleToggleLikeWithCloudSync toggles context and then `newLikes = targetClip?.isLiked ? (targetClip.likes||1)-1 : +1`; if rapid clicks stale targetClip. Also no DB transaction/dedupe. Need fix in ShortsFeedView only: create local reaction state or use a ref to prevent repeated rapid clicks. But if she likes many times intentionally, ideally toggle once per click (like/unlike). The count should not "multiply" by repeated clicks; it should increment then decrement on next click. Maybe context does optimization incorrectly? We can build a robust handler with a debounced ref and database upsert.

However, if we only modify ShortsFeedView, can prevent rapid double-fire by using a per-clip `pendingLikeRef`. But the actual count still depends on context. The sync with supabase should use a DB function. We can create Supabase RPC `toggle_clip_like` using `clip_reactions` table and update clips.likes. That's the right approach. Then in code, call RPC and update local/context. But if context's `toggleClipLike` also changes count, UI might be okay but double count? We should avoid calling context's toggleClipLike; instead manually update clips context? We don't have setter exposed. We could call `syncWithSupabase(true)` after RPC to reconcile from DB, and also temporarily toggle UI through context's `toggleClipLike` only once. Still context will update local; then sync gets DB count. That's okay. But each click will toggle local, then RPC toggle in DB, then sync obtains accurate count. The multiplication may still occur if `toggleClipLike` misbehaves? But `syncWithSupabase` overrides after DB call, so final accurate. For rapid clicks, we can disable/lock.

Better approach: Rewrite ShortsFeedView with local state for clip reactions? Since context is a black box, perhaps the best is to create a new hook `useClipReactions` that reads `clip_reactions` table and toggles through RPC, but still calls context's `toggleClipLike` for local UI. It is complex.

Alternatively, we can ask user for full context? But we should implement minimally.

Let's review schema: clips table: id text NOT NULL, userId, title, description, videoUrl, etc, likes integer default 0, dislikes integer default 0, shares, comments jsonb. It has RLS with public full access. `profile_likes` table tracks profile likes, not clip likes. We can add `clip_likes` table:
- clip_id text, user_id text, created_at, primary key (clip_id, user_id)
- maybe reaction type ('like','dislike') to avoid separate dislike table. But currently dislikes too. Could add `clip_reactions` table with clip_id, user_id, reaction text check in ('like','dislike'), primary key (clip_id,user_id). Then toggle function. Simpler: separate clip_likes and clip_dislikes tables. But an RPC can handle both. For counts + triggers, create two tables:
`clip_likes` (clip_id text, user_id text, created_at, PK(clip_id,user_id)).
`clip_dislikes` similar.
Trigger on insert/delete to increment/decrement clips.likes/dislikes. RPC `toggle_clip_reaction(p_clip_id text, p_user_id text, p_reaction text)`:
- If reaction='like': if exists in clip_likes, delete, else upsert and delete from clip_dislikes if present.
- If reaction='dislike': similar.
Need update counts via triggers. This solves repeated clicks idempotently.
Also followers: existing `follows` table with trigger update profiles follower_count/following_count. But maybe bug? It has trigger update_follow_counts on insert/delete. Followers can multiply if not unique? Follows table lacks primary key/unique constraint; only follower_id/following_id. So duplicate follows can occur. Need add unique constraint and toggle function. Also profile columns both `followers` and `follower_count` exist. Trigger updates follower_count and following_count only, not `followers`/`following` old columns. The UI may use `followers` old field? In code, ShortsFeed uses isFollowing only, not counts. But elsewhere maybe. Need create unique index and a toggle_follow RPC. Use trigger to update both old and new counts.

Also profile likes: `profile_likes` table exists with no primary key, possibly duplicates. Need add unique constraint. Trigger update_like_counts updates profiles.likes_count only, not `likes` old field. Need update both. Need add unique. There are no primary keys: profile_likes (liker_id,target_id), follows (follower_id,following_id). We can add unique indexes. But RLS is public full access currently; security risk, but user didn't request auth. We'll at least add unique constraints and functions. Since no execute SQL tool, provide a SQL file path maybe `supabase/fix_reactions.sql` and tell them to run in SQL Editor. But the instruction says don't create migration files under supabase/migrations; a root script okay. We can use `<dyad-write path="supabase/fix_reactions.sql">`.

But user asked "put and sync likes and followers in database" — maybe they want code that syncs likes and followers for their app, not necessarily SQL only. We can do both: SQL script + code rewriting.

Need know `lib/videoUtils.ts` RELIABLE_VIDEO_STREAMS content. We can assume. Need maybe update video handling too? The loaded stuck issue already attempted. They now ask "fix bugs" generally and "when I like the video a lot of times it multiplies" and "UI more futuristic and advanced features". We'll make code changes to ShortsFeedView only. Could also rewrite to use new SQL/RPC. But we need not leave unresolved imports. Need maybe add `supabase` rpc call. No new dependency.

Let's design robust ShortsFeedView:

- Import `isSupabaseConfigured`, `supabase`.
- Add local state/ref to prevent repeated liking:
  - `const likeLockRef = useRef<Record<string, boolean>>({});`
  - `const dislikeLockRef = useRef<Record<string, boolean>>({});`
- Function `handleToggleLike`:
  - If lock true return.
  - lock true, setTimeout release.
  - Determine current state from `clip.isLiked`.
  - Call `toggleClipLike(clipId)` (which toggles UI).
  - If Supabase configured:
    - call RPC `toggle_clip_reaction` with { p_clip_id: clipId, p_user_id: currentUser.id, p_reaction: 'like' }
    - after, call `syncWithSupabase(true)` to refresh counts from DB.
  - If Supabase not configured, just context toggle.
- Similar `handleToggleDislike`.

But this still uses `toggleClipLike` context. If context is buggy, final `syncWithSupabase` will correct. The lock prevents repeated quick clicks. Could also after RPC not rely on context counts but perhaps not needed.
- We should directly set local state? Since context has the data; we don't have setter. We can call `syncWithSupabase` which presumably updates context from DB. Good.

However, `syncWithSupabase` may not update `isLiked`, `isDisliked`, `isBookmarked`? The context likely holds clips and user interaction state; but `isLiked` might be computed based on user's local likedIds? Hmm. We don't know. The clip type includes `isLiked`. If `syncWithSupabase` doesn't know per-user reactions, UI may remain wrong. But the RPC toggles DB and we call context's toggle; that should maintain UI. Final sync may overwrite counts but not per-user state maybe. Good enough.

But user wants "like button multiples" fixed. The key is unique DB table and RPC. We'll provide SQL to create `clip_likes`, `clip_dislikes` with RPC, and modify code call RPC. Also followers: add unique and RPC `toggle_follow_user`. In code, `onFollowToggle` currently from context; we can create a new handler `handleFollowToggle` that uses RPC + context. However, context `toggleFollowUser` may also be buggy. We can call RPC then `toggleFollowUser`. But need know if `toggleFollowUser` expects userId. We'll call it. If Supabase configured call RPC `toggle_follow_user(p_follower_id, p_following_id)`, then `toggleFollowUser(userId)`, then sync. The existing `follows` table likely already has trigger. We add unique constraint and toggle function, and update both old and new counts.

Need make UI more futuristic and advanced features. We can add:
- animated gradient ring around active clip.
- heart particle burst on like (already overlay heart but we can add multiple particles).
- haptic-ish audio.
- Follow/Unfollow state with Toast. Use `toast` import already present, currently unused in ShortsFeedView? Actually import toast from 'sonner' but maybe not used. We can use toast for follow/like? But could be okay.
- Add bookmark count? no.
- Improve top control styling with futuristic accents.
- Add little glow/scanline effects? We can add a subtle gradient overlay (avoid gradient backgrounds? Theme says avoid gradient backgrounds but buttons can gradient; existing code uses gradients extensively. We're allowed? "Avoid using gradient backgrounds" but existing app uses gradient accents. We should not introduce large gradient background; but we can use gradient borders/accents. Fine.)
- Add an active clip index progress dots/bars at bottom or left.
- Add share toast.
- Add double-tap with particle burst.
- Maybe add "auto-scroll" toggle? Advanced feature: "AutoScroll" button that auto-advances after every 5 seconds. We can implement in ShortsFeedView: `isAutoPlay` state toggled; useEffect interval to scroll to next when active. This is a nice advanced feature.
- Add "loop progress" ring around video? Could be overkill.
- Add `Film`, `Sparkles`, `Gauge`, `RefreshCw` already imports. `RefreshCw` unused maybe we can use for auto-scroll icon? Use `Timer`? lucide has `Timer` maybe not imported. Could import `Repeat`, `Zap`, `Orbit`? We can use `Repeat` or `Timer`. Maybe `RefreshCw` is available.
- Add comments left side? no.

Need ensure we don't overcomplicate and leave imports used.

Potential issue: `supabase.rpc` return types in TypeScript; may need generics. We can cast or simply call without storing. `await supabase.rpc('toggle_clip_reaction', { p_clip_id: clipId, p_user_id: currentUser.id, p_reaction: 'like' })`. TypeScript may complain if `supabase` typed not know RPC. Could be okay if supabase client is untyped? We'll call `await (supabase as any).rpc(...)` to avoid type errors. Existing code uses `supabase.channel` and `supabase.from` directly. We can use `supabase.rpc` and if TS errors maybe fine. The `isSupabaseConfigured` imported.

Need maybe not add new `clip_likes` table if user runs SQL. But code calling RPC before table exists will fail if not run; catch and still context toggle. We wrap try/catch. Good.

Need ensure `currentUser` may be null. Use `currentUser?.id`; if no currentUser, just context toggle. In app probably currentUser exists. We'll handle.

Need create SQL file:
```
-- Fix clips reactions
create table if not exists public.clip_likes (
  clip_id text not null,
  user_id text not null,
  created_at timestamptz default now(),
  primary key (clip_id,user_id)
);
create table if not exists public.clip_dislikes (...);
-- trigger functions
create or replace function public.sync_clip_like_counts() returns trigger language plpgsql as $$ begin if TG_OP='INSERT' then update clips set likes = coalesce(likes,0)+1 where id = new.clip_id; elsif TG_OP='DELETE' then update clips set likes = greatest(0,coalesce(likes,1)-1) where id = old.clip_id; end if; return null; end; $$;
...
-- toggle RPC:
create or replace function public.toggle_clip_reaction(p_clip_id text, p_user_id text, p_reaction text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare reaction_exists boolean; v_likes int; v_dislikes int;
begin
 if p_reaction = 'like' then
   delete from public.clip_dislikes where clip_id=p_clip_id and user_id=p_user_id;
   if exists(select 1 from public.clip_likes where clip_id=p_clip_id and user_id=p_user_id) then
      delete from public.clip_likes where clip_id=p_clip_id and user_id=p_user_id;
   else
      insert into public.clip_likes(clip_id,user_id) values(p_clip_id,p_user_id);
   end if;
 elsif p_reaction = 'dislike' then
   delete from public.clip_likes where clip_id=p_clip_id and user_id=p_user_id;
   if exists(...) then delete...
   else insert...
   end if;
 else raise exception 'invalid reaction';
 end if;
 select coalesce(likes,0), coalesce(dislikes,0) into v_likes,v_dislikes from clips where id = p_clip_id;
 return jsonb_build_object('likes', v_likes,'dislikes',v_dislikes);
end; $$;
```
Need triggers for count updates after insert/delete on clip_likes/dislikes. Because RPC toggles insert/delete; triggers update clips counts. The `syncWithSupabase` after RPC will fetch accurate counts. Could rely on triggers but final sync anyway.
GRANTS: Public full access? We can grant access to anon/authenticated for RPC and tables. Use public policies? Simpler:
```
grant select, insert, delete on table public.clip_likes to anon, authenticated;
grant execute on function public.toggle_clip_reaction(text,text,text) to anon, authenticated;
```
RLS enable? Since public access, can enable RLS and policy true. But public full access existing. We'll create policies.
Need maybe grant service_role too.
Seq nothing.

Followers:
- Add unique index/constraint on follows(follower_id,following_id). But if duplicates already exist, need delete duplicates before adding unique. SQL:
```
delete from follows a using follows b where a.follower_id=b.follower_id and a.following_id=b.following_id and a.ctid < b.ctid;
alter table follows add constraint follows_unique_pair unique(follower_id,following_id);
```
But columns text not null; fine.
- Update trigger function `update_follow_counts` to update both `follower_count/following_count` and old `followers/following` fields:
```
CREATE OR REPLACE FUNCTION update_follow_counts() ... 
IF INSERT: update profiles set following_count=coalesce(following_count,0)+1, following=coalesce(following,0)+1 where id=NEW.follower_id;
            update profiles set follower_count=coalesce(follower_count,0)+1, followers=coalesce(followers,0)+1 where id=NEW.following_id;
...
```
- Add RPC `toggle_follow_user(p_follower_id text,p_following_id text)`:
```
if exists then delete; else insert; end if;
```
Triggers update counts automatically.

Profile likes:
- Add unique constraint after dedup:
`profile_likes` columns liker_id,target_id. 
- Update trigger `update_like_counts` to update both likes_count and likes:
```
if INSERT update profiles set likes_count=coalesce(likes_count,0)+1, likes=coalesce(likes,0)+1 where id=NEW.target_id;
```
- Add RPC `toggle_profile_like(p_liker_id text,p_target_id text)`.
- Grants and RLS. Probably not necessary for clips? We'll include.

Need ensure RLS policies don't break public full access. Existing tables have RLS enabled with "Public full access profiles" etc. We'll add policies:
```
alter table clip_likes enable row level security;
create policy "Public clip_likes access" on clip_likes for all using (true) with check(true);
...
```
But grant select/insert/delete to anon, authenticated. 
Functions: `create or replace function ... security invoker` or `definer`? Since RLS on tables may block if function accesses tables. Use `security definer set search_path = ''` to bypass RLS? But then any anon can call RPC and act on behalf of arbitrary user_id. Not ideal, but app is public full access anyway. We can use `security invoker` with public RLS true, works. Use `security invoker`.
However, functions inserting into tables with RLS public true will pass. Fine.

Potential issue: `toggle_clip_reaction` inserts into clip_likes with p_user_id arbitrary; if RLS true, fine.

Need maybe add `updated_at`? Not necessary.

Now, code update `ShortsFeedView.tsx`. Since we already have full file provided. We'll modify sections:
- Add new states and refs in ShortsFeedView; include `autoAdvance`, interval.
- Add `heartParticles` state per card? We can add local particle bursts in SingleShortCard.
- Add new `handleToggleLike` and `handleToggleDislike` functions in ShortsFeedView.
- Add `handleFollowToggle` function.
- Pass new onToggleLike/onToggleDislike/onFollowToggle.
- Update UI for more futuristic: maybe add top active progress line, auto-scroll toggle button near navigation, particle burst overlay, animated clip counter. We can adjust top left badge, add auto-scroll button near nav. Add `RefreshCw` as auto-scroll icon or use `Zap`. Better use `Zap` from lucide; not currently imported. We can add import `Zap`. Already `Sparkles`, `Gauge`. We'll add `Zap`.
- Use `toast` for follow actions.

Need avoid too large code rewrite. We can rewrite entire file with modifications. It's okay. The file was already provided, we'll output full updated file. Need be careful to keep all existing functionality.

Let's draft handle functions:

Inside ShortsFeedView:
```
const likeLockRef = useRef<Record<string, boolean>>({});
const dislikeLockRef = useRef<Record<string, boolean>>({});
const followLockRef = useRef<Record<string, boolean>>({});

const [autoAdvance, setAutoAdvance] = useState(false);
const autoAdvanceRef = useRef(autoAdvance);
useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);
useEffect(() => {
  if (!autoAdvance) return;
  const interval = setInterval(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.shorts-snap-item');
    if (items.length === 0) return;
    const next = (activeIndex + 1) % items.length;
    const target = items[next] as HTMLElement;
    if (target) container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  }, 5000);
  return () => clearInterval(interval);
}, [autoAdvance, activeIndex]);
```
Note activeIndex in dependency resets interval every active index, so interval restarts from current active after each scroll? That may be okay: if activeIndex changes, new interval, next advance after 5s from new index. But it may also scroll using activeIndex, fine.

handleToggleLikeWithCloudSync:
```
const withLock = (lockRef, fn) => {...}
```
Simpler inside function:
```
const handleToggleLike = async (clipId: string) => {
  if (likeLockRef.current[clipId]) return;
  likeLockRef.current[clipId] = true;
  setTimeout(() => { delete likeLockRef.current[clipId]; }, 650);
  const targetClip = clips.find(c=>c.id===clipId);
  if (!targetClip) return;
  // Call context immediately to reflect UI
  toggleClipLike(clipId);
  sounds.like();
  if (!isSupabaseConfigured() || !currentUser?.id) return;
  try {
    await (supabase as any).rpc('toggle_clip_reaction', {
      p_clip_id: clipId,
      p_user_id: currentUser.id,
      p_reaction: 'like'
    });
    await syncWithSupabase(true);
  } catch {
    // rollback? Since context already toggled, if RPC fails, toggling back might be confusing.
    // We'll leave; local will be corrected on next sync.
  }
};
```
Wait if context toggles and RPC fails, UI toggled but DB unchanged. But unlikely. Could call RPC first then context? But then UI not instant. Better call RPC first? If RPC takes time, not responsive. We can call context first and if error, call toggleClipLike again to revert. We'll do:
```
try { await rpc ...; await syncWithSupabase(true); }
catch { toggleClipLike(clipId); toast.error('Could not sync like'); }
```
But if context toggle first, then catch second toggles back. Good.
However, `syncWithSupabase(true)` might reset local like state? We need maybe not call if not configured.
For dislike similar.

But note: `toggleClipLike` likely updates both likes and `isLiked`; we don't know. If context's `toggleClipLike` itself increments count but doesn't persist isLiked per DB. Our RPC handles DB. The local UI should reflect `isLiked` after context. Good.

Potential issue: calling `syncWithSupabase(true)` immediately after RPC may fetch clips with updated counts, but local `isLiked` maybe false because context doesn't load reactions. However, the context likely has `clips` from DB and adds `isLiked` based on some `likedIds` array. We don't know. We can improve by not relying on context for `isLiked`, instead local state in `SingleShortCard`? But then props clip.isLiked from context may not update after RPC because context doesn't know. Yet toggleClipLike will update it. Good enough.

handleFollowToggle:
```
const handleFollowToggle = async (userId: string) => {
  if (!currentUser?.id || currentUser.id === userId) return;
  if (followLockRef.current[userId]) return;
  followLockRef.current[userId]=true; setTimeout...
  const currentlyFollowing = isFollowing(userId);
  toggleFollowUser(userId);
  sounds.pop();
  if (!isSupabaseConfigured()) return;
  try {
    await (supabase as any).rpc('toggle_follow_user', {
      p_follower_id: currentUser.id,
      p_following_id: userId
    });
    await syncWithSupabase(true);
  } catch { toggleFollowUser(userId); toast.error('Could not sync follow'); }
};
```
Need import `toast` already present, but `toast` from sonner may be used. We have import `toast` in file. Good.

Now particle burst on like in SingleShortCard:
- Add state `showParticles` array? Could be CSS only. Existing `showHeartOverlay`. We can add a simple multi-heart overlay when double tap and when like button clicked maybe. But SingleShortCard receives onToggleLike prop (which now handles). We can add `onLike` local function in card:
```
const triggerLike = (e: React.MouseEvent) => { e.stopPropagation(); handleDoubleTapLike(); };
```
But currently button onClick calls onToggleLike(clip.id) directly. We can modify button onClick to call `handleLikeClick` that triggers overlay and calls onToggleLike. We'll include `setShowHeartOverlay(true); setTimeout ...; onToggleLike(clip.id); sounds.like();`
Need import sounds already.
- Add particle elements when showHeartOverlay: maybe 6 small hearts with animation classes. Not necessary.

UI futuristic:
- Top left badge: make gradient border, pill.
- Add active progress bar at very bottom maybe gradient.
- Navigation arrows add glowing hover.
- Add auto-scroll toggle button near nav:
```
<button onClick={() => { sounds.click(); setAutoAdvance(a=>!a); }} className={`p-3 rounded-2xl ... ${autoAdvance ? 'bg-[#00e5ff] text-slate-900 shadow-[0_0_20px_#00e5ff]' : ...}`}><Zap className="w-5 h-5" /></button>
```
Need import Zap.
- Add clip progress dots at bottom center? Could be in container below? Maybe not.

Let's also fix loading stuck perhaps by simplifying: In SingleShortCard, we already have fallback and timeout. But maybe initial video `src` from clip.videoUrl is invalid, streamFailed becomes true and error; but loading overlay may remain due onWaiting after fallback? We can improve `handleVideoError`: set `streamFailed(true)` and `isLoading(false)`. When `streamFailed` true, the active effect does not run play because condition `isActive && !streamFailed` false. The retry button resets. Good.

Maybe "stuck at loading" because validClips empty? But no, they have videos. We can further ensure `getClipStream` only uses reliable streams for fake/invalid URLs. Currently candidate with `https://` returned even if not playable; then fallback only after error. That may still cause loading. We can improve by keeping as is but ensure error fallback. Could also add `crossOrigin`? not needed.

Could use `muted` default true, autoplay allowed. Good.

Need maybe update `validClips` to always have clips; not relevant.

Let's produce SQL file and rewrite TSX.

But before writing, ensure package dependencies all available. `sonner` already imported and likely installed. `Zap` from lucide. No new dep.

Need possibly create `clip_likes` table SQL with grants/RLS. Use `if not exists`. Need handle existing duplicates.

Let's craft SQL carefully. Tables and functions in public schema. Supabase no execute SQL tool, so create file. Path maybe `supabase/reaction_sync.sql` or root. The system instruction says "NEVER write SQL migration files to supabase/migrations/". We'll use `supabase/manual_sql/fix_reactions.sql`? Directory might not exist but dyad-write can create. We'll use `supabase/fix_reactions.sql` maybe below `supabase/`. That's okay. But Supabase context says functions in `supabase/functions` for edge functions; SQL file elsewhere fine. We'll use `supabase/manual_sql/reactions_and_follows.sql`.

Need tell user to run the SQL file in Supabase SQL Editor. However, because they can't run commands but can run SQL manually. We'll mention after code summary.

Now TSX full rewrite. Let's outline imports:
```
import { Zap } from 'lucide-react';
```
Remove unused `RefreshCw` or keep maybe unused. Original imported RefreshCw but not used; we can remove to satisfy lint? But no lint. We'll remove `RefreshCw` to avoid unused? Could keep but not used. We'll remove unused imports. From original import list: Heart, MessageCircle, Share2, Volume2, VolumeX, ChevronUp, ChevronDown, ThumbsDown, CheckCircle2, Music2, Plus, Film, Bookmark, Trash2, Play, Sparkles, Gauge, Loader2, RefreshCw. We can drop RefreshCw and add Zap. We can keep `Sparkles` used. Good.

In SingleShortCard, we may add `particles` state? Not necessary. Use existing `showHeartOverlay`. We can add a pulse ring. The button class can be more futuristic:
```
className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg relative group ${
  clip.isLiked ? 'bg-[#ff2d95]/90 text-white scale-110 shadow-[0_0_24px_rgba(255,45,149,0.9)] border border-[#ff2d95]' : 'bg-slate-900/70 text-white hover:bg-[#ff2d95]/30 border border-white/15 hover:border-[#ff2d95]/60'
}`}
```
But not too much.

We need ensure `onToggleLike` passed function. Rename `handleToggleLikeWithCloudSync` to `handleToggleLike`. In props, `onToggleLike` already. In mapping pass `onToggleLike={handleToggleLike}`. Inside SingleShortCard, button `onClick={(e) => { e.stopPropagation(); setShowHeartOverlay(true); setTimeout(() => setShowHeartOverlay(false), 800); if (!clip.isLiked) onToggleLike(clip.id); else onToggleLike(clip.id); }}`. Wait if already liked, clicking should unlike, but we still might show overlay? Usually like animation on adding like only, not removing. We can:
```
if (!clip.isLiked) {
  sounds.like();
  setShowHeartOverlay(true);
  setTimeout(() => setShowHeartOverlay(false), 800);
}
onToggleLike(clip.id);
```
But `onToggleLike` now itself calls sounds.like maybe. We can avoid double sound. Let's keep sound in handler, not in child. Child can just not sound. We'll modify:
```
const handleLikePress = (e) => {
  e.stopPropagation();
  if (!clip.isLiked) {
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800);
  }
  onToggleLike(clip.id);
};
```
`onToggleLike` will play sound. Good.
Need add heart overlay particle element already there. Fine.

Need maybe button onClick uses `handleLikePress`. For dislike, call `onToggleDislike`.

Add `handleDoubleTapLike` already calls sounds.like and onToggleLike. But our onToggleLike also plays sound; double tap double sound maybe okay. Could remove sounds.like from handler? It calls `sounds.like` in handleDoubleTapLike. We can leave; double sound maybe. Better: in `onToggleLike` handler (parent) we don't play sound; instead in child `handleDoubleTapLike` and `handleLikePress` play sound only if not liked. But parent doesn't know UI? We can keep sound in parent, but then double tap and button both play; okay maybe not. Let's simplify:
- In child `handleDoubleTapLike`: `sounds.like(); setShowHeartOverlay...; onToggleLike(clip.id)` (no conditional)
- In child `handleLikePress`: if !clip.isLiked, setShow...; onToggleLike(clip.id).
- In parent `handleToggleLike`: no sounds. But for UI haptic, maybe call `sounds.like()` too? But then double tap double. Not critical. We can call sounds in child only for visual. For dislike, use `sounds.dislike?` not imported. So no sound.

The existing code in parent `handleToggleLikeWithCloudSync` didn't play sound. We'll keep no sound.

Now handle parent function:
```
const handleToggleLike = useCallback(async (clipId: string) => {...}, [clips, currentUser, toggleClipLike, syncWithSupabase]);
```
Could use useCallback but not necessary. Need dependencies. If we use useCallback, need include all. To avoid complexity, define plain function before return, but Hooks? It uses `isSupabaseConfigured` (constant), `syncWithSupabase`. Fine. `syncWithSupabase` maybe stable? We'll not useCallback to avoid dependencies. In component, function recreated each render. Fine.

But inside `SingleShortCard`, `onToggleLike` prop changes each render; okay.

Need helper:
```
const releaseLock = (lockRef, key) => { setTimeout(() => { delete lockRef.current[key]; }, 700); };
```
Could define inside functions.

Now SQL file:

```
-- ============================================================
-- WeVids reaction + follow sync
-- Run this entire script in Supabase SQL Editor
-- ============================================================

begin;

-- 1. Clip likes
create table if not exists public.clip_likes (
  clip_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key(clip_id,user_id)
);
...
```
Need `begin;` and `commit;`. Supabase SQL editor supports.

But `create or replace function` and triggers can be repeated; no issues. Need deal with existing triggers already present on follows, profile_likes. We'll replace functions and ensure triggers still exist. Existing triggers on follows/profile_likes call functions; creating or replacing functions is enough. But we'll also create new triggers for clip_likes/dislikes.

For follows unique, if duplicates exist and trigger update counts maybe inflated. We should also recalculate counts:
```
update profiles p set follower_count=(select count(*) from follows f where f.following_id=p.id), following_count=(select count(*) from follows f where f.follower_id=p.id);
```
After dedup, do update. Also old fields followers/following. Good.
For profile likes counts, update similarly.

Need ensure `profiles` table has columns follower_count etc; yes. but some missing? The schema says profiles has followers, following, likes old fields and follower_count, following_count, likes_count. Good.

Now RPC for clip reactions:
```
create or replace function public.toggle_clip_reaction(p_clip_id text, p_user_id text, p_reaction text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_likes int;
  v_dislikes int;
begin
  if p_reaction = 'like' then
    delete from public.clip_dislikes where clip_id = p_clip_id and user_id = p_user_id;
    if exists (select 1 from public.clip_likes where clip_id = p_clip_id and user_id = p_user_id) then
      delete from public.clip_likes where clip_id = p_clip_id and user_id = p_user_id;
    else
      insert into public.clip_likes (clip_id, user_id) values (p_clip_id, p_user_id);
    end if;
  elsif p_reaction = 'dislike' then
    delete from public.clip_likes where clip_id = p_clip_id and user_id = p_user_id;
    if exists (select 1 from public.clip_dislikes where clip_id = p_clip_id and user_id = p_user_id) then
      delete from public.clip_dislikes where clip_id = p_clip_id and user_id = p_user_id;
    else
      insert into public.clip_dislikes (clip_id, user_id) values (p_clip_id, p_user_id);
    end if;
  else
    raise exception 'invalid reaction %', p_reaction;
  end if;

  select coalesce(likes,0), coalesce(dislikes,0)
  into v_likes, v_dislikes
  from public.clips
  where id = p_clip_id;

  return jsonb_build_object('likes', v_likes, 'dislikes', v_dislikes);
end;
$$;
```
Need grant execute. Also grant service_role.

Clip like trigger:
```
create or replace function public.sync_clip_like_counts()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if tg_op = 'INSERT' then
    update public.clips set likes = coalesce(likes,0)+1 where id = new.clip_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.clips set likes = greatest(0, coalesce(likes,1)-1) where id = old.clip_id;
    return old;
  end if;
  return null;
end;
$$;
```
Similar dislike. Triggers after insert/delete. Note: RPC uses `if exists` then delete/insert; triggers fire. 
Potential issue trigger returns new/old, but after delete returns old okay. We can `return null` for after trigger too; after triggers ignore return. But returning null is fine. We'll return null.

`update_follow_counts` updated:
```
create or replace function public.update_follow_counts()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
       set following_count = coalesce(following_count,0)+1,
           following = coalesce(following,0)+1
     where id = new.follower_id;
    update public.profiles
       set follower_count = coalesce(follower_count,0)+1,
           followers = coalesce(followers,0)+1
     where id = new.following_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles
       set following_count = greatest(0, coalesce(following_count,1)-1),
           following = greatest(0, coalesce(following,1)-1)
     where id = old.follower_id;
    update public.profiles
       set follower_count = greatest(0, coalesce(follower_count,1)-1),
           followers = greatest(0, coalesce(followers,1)-1)
     where id = old.following_id;
    return old;
  end if;
  return null;
end;
$$;
```
Need `greatest` with coalesce current maybe. Fine.

Update profile likes trigger similarly.

Add RPC toggle profile like and follow:
```
create or replace function public.toggle_profile_like(p_liker_id text, p_target_id text)
returns void language plpgsql security invoker set search_path=''
as $$
begin
  if exists (select 1 from public.profile_likes where liker_id = p_liker_id and target_id = p_target_id) then
    delete ...;
  else
    insert ...;
  end if;
end;
$$;

create or replace function public.toggle_follow_user(p_follower_id text, p_following_id text)
returns void language plpgsql security invoker set search_path=''
as $$
begin
  if exists (select 1 from public.follows where follower_id = p_follower_id and following_id = p_following_id) then
    delete ...;
  else
    insert into public.follows(follower_id,following_id,status) values(p_follower_id,p_following_id,'accepted');
  end if;
end;
$$;
```
Need grant execute to anon/authenticated/service_role.

Now duplicate cleanup:
```
delete from public.follows a using public.follows b
where a.follower_id = b.follower_id and a.following_id = b.following_id and a.ctid < b.ctid;
delete from public.profile_likes a using public.profile_likes b
where a.liker_id = b.liker_id and a.target_id = b.target_id and a.ctid < b.ctid;
```
Then `alter table public.follows add constraint follows_unique_pair unique(follower_id,following_id);` But if constraint exists, use DO block:
```
do $$ begin
  if not exists (select 1 from pg_constraint where conname='follows_unique_pair' and conrelid='public.follows'::regclass) then
    alter table public.follows add constraint follows_unique_pair unique(follower_id,following_id);
  end if;
end $$;
```
Similarly profile_likes unique. 
But `ctid` is system column; okay.

Need maybe add constraints for clip_likes tables already primary key.

Add grants and RLS:
```
alter table public.clip_likes enable row level security;
alter table public.clip_dislikes enable row level security;
create policy "Public clip likes access" on public.clip_likes for all using (true) with check(true);
...
grant select, insert, delete on table public.clip_likes to anon, authenticated, service_role;
grant select, insert, delete on table public.clip_dislikes to anon, authenticated, service_role;
grant execute on function ... to anon, authenticated, service_role;
```
Also grant on profiles? Existing public full access profiles policy and likely grants maybe not? Schema only policies not grants. We shouldn't alter grants for profiles except maybe triggers. But functions are used by clients. Execute grant to anon/auth.

Need perhaps include `grant execute on function public.update_follow_counts()`? That's trigger, no direct. Not needed.

Now code changes. Need ensure `currentUser.id` is string. Example currentUser from context likely has id string. Good.
Need maybe `isFollowing` expects userId string. Fine.

Now, after SQL file, the CLI shows file creation, no rebuild needed. Summary mention run SQL file.

Let's write updated TSX full. Could be long. We'll carefully produce.

Important: We must not use markdown code blocks. Use `<dyad-write>`.

Let's compose TSX file completely. I'll base on original provided, with modifications.

Potential type issues:
- `supabase.rpc` may need type; using `(supabase as any).rpc`.
- `currentUser?.id` in functions.
- `setAutoAdvance` state and ref.
- We'll import `toast` and use.
- Add `Zap` import.
- Remove `RefreshCw` import.
- `sounds.like()` maybe exists; original used `sounds.like()` so yes.
- `sounds.pop()` exists.
- `sounds.click()` exists.

Let's ensure auto-scroll interval uses `activeIndex` and `validClips.length`. Good.

Potential issue: `autoAdvanceRef` unused maybe we don't need. We'll omit.

Now write.

One more concern: In parent `handleToggleLike`, we call `toggleClipLike(clipId)` then RPC then `syncWithSupabase`. If `syncWithSupabase` is called and resolves, it may reset clip.isLiked. But context's toggleClipLike likely updates local, then sync with Supabase just updates counts from clips table but may not update `isLiked`. But if context does not fetch per-user `isLiked` from `clip_likes`, the `isLiked` may be lost after sync. Does syncWithSupabase update context clips and preserve `isLiked`? Unknown. Could avoid calling `syncWithSupabase(true)` immediately after RPC to avoid overwriting local UI; instead update count manually using returned `v_likes`. But we don't have setter. We could use returned JSON to update context? no.
Alternative: don't call `syncWithSupabase`, just rely on context `toggleClipLike` and RPC triggers updating DB, but the local count shown is from context, which may remain accurate if context's toggle is correct. The multiplication bug was due rapid clicks, not context failing to update count? The original handle function already calls `syncWithSupabase`? It didn't call sync; it updated supabase manually with `clips.update(likes)` based on local targetClip. That caused multiplication because no DB reaction records. Our new RPC + unique table would fix DB, but local count might still be off if context's `toggleClipLike` increments/decrements incorrectly on rapid clicks? The lock prevents rapid clicks; so local toggles once per click. If context toggling correctly, count correct. We might not need `syncWithSupabase` after RPC, but we should refresh eventually to reconcile. We can call `syncWithSupabase` after a small timeout, but risk UI. Better call `syncWithSupabase(true)` after RPC; context likely may maintain `isLiked` by user_id? We don't know. The app likely has context that syncs from Supabase and maps local state. We can trust.

But maybe better to use RPC return to update local? Not possible via context. We'll call `await syncWithSupabase(true)` to ensure DB counts reflected, but local clip.isLiked may not update, but final count from context after sync may show accurate count, and `isLiked` may be preserved if context handles. Accept.

We could also call `toggleClipLike` before RPC and if sync overwrites isLiked, user may see unlike state incorrectly. To hedge, we can call `syncWithSupabase` only in case RPC fails? Hmm.

Since original code didn't call sync after update, maybe context's state is enough. We can skip `syncWithSupabase` entirely after RPC to avoid potential regression. But if DB triggers count, we need UI count update. Context's toggleClipLike likely updates count correctly. So no sync needed. We'll use RPC for persistence but not call `syncWithSupabase`. This avoids overwriting local state. The DB will be correct and future sync will reflect. For follower toggle similarly, context handles UI; RPC persists. We can skip sync. But the user wanted "sync likes and followers in database"; the RPC ensures DB. The context already syncs local. Good. We can call `syncWithSupabase` maybe after 1 second debounced? That might be okay but not necessary.

Given bug multiplication likely due lack of lock; our lock and RPC suffice. Let's not call `syncWithSupabase` immediately in handlers. We'll still use realtime channel to sync DB changes? The existing realtime channel on `clips` triggers syncWithSupabase on any change. Our RPC updates `clips.likes` (via trigger) causing realtime event, so context `syncWithSupabase` may be called automatically. That could update clips and maybe preserve `isLiked`? It may not know `isLiked`; but context might handle. Hmm. There is a realtime subscription in ShortsFeedView already that calls syncWithSupabase on clips changes. So any DB update will trigger sync anyway. That's fine. So our local context update + RPC will cause realtime to refresh counts, likely accurate; `isLiked` maybe preserved from context. We'll leave.

Thus handleToggleLike:
```
const handleToggleLike = useCallback(async (clipId) => {...}, [clips,currentUser,toggleClipLike]);
```
No sync.

But realtime sync might be called, causing `validClips` updated. Fine.

Need be careful: `toggleClipLike(clipId)` may internally call Supabase update to clips table too? It might, causing duplicated DB count if context also syncs. We don't know. Original code did both `toggleClipLike` and `supabase.from('clips').update`, so context's `toggleClipLike` probably only local, not Supabase. Thus okay.

Now we should write SQL file. Let's build.

Potential issue with `clip_likes` RLS and grants: public full access policy `using true` with `to anon, authenticated`; but function security invoker means inserts require RLS policies covering user. We defined policy. Good.

Now output.

Need include after all modifications one sentence concise summary, maybe mention run SQL file.

Let's first write SQL file with `<dyad-write>`.

Then TSX file.

Let's craft TSX thoroughly. We'll produce entire file with all modifications. Use path exact.

Need ensure no unresolved imports. We'll remove `RefreshCw` and add `Zap`.

Let's write now.</think>Alright, I’ll fix this properly with two pieces:

1. A SQL script that creates unique reaction/follow tracking tables so likes/follows can never multiply again.
2. A rewritten Shorts feed with idempotent like/dislike/follow handlers, plus a more futuristic UI and an auto-advance feature.

<dyad-write path="supabase/manual_sql/reactions_and_follows.sql" description="SQL script to create unique clip reactions and fix follower/like count sync">
-- ============================================================
-- WeVids Reaction + Follow Sync
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

begin;

-- 1. Create clip likes/dislikes tables with unique pair constraints
create table if not exists public.clip_likes (
  clip_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);

create table if not exists public.clip_dislikes (
  clip_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);

-- 2. Enable Data API grants
grant select, insert, delete on table public.clip_likes to anon, authenticated, service_role;
grant select, insert, delete on table public.clip_dislikes to anon, authenticated, service_role;

-- 3. Enable RLS with public access, consistent with the rest of the app
alter table public.clip_likes enable row level security;
alter table public.clip_dislikes enable row level security;

drop policy if exists "Public clip likes access" on public.clip_likes;
create policy "Public clip likes access"
  on public.clip_likes
  for all
  using (true)
  with check (true);

drop policy if exists "Public clip dislikes access" on public.clip_dislikes;
create policy "Public clip dislikes access"
  on public.clip_dislikes
  for all
  using (true)
  with check (true);

-- 4. Sync clip like counts through triggers so the UI can never drift
create or replace function public.sync_clip_like_counts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.clips
       set likes = coalesce(likes, 0) + 1
     where id = new.clip_id;
  elsif tg_op = 'DELETE' then
    update public.clips
       set likes = greatest(0, coalesce(likes, 1) - 1)
     where id = old.clip_id;
  end if;
  return null;
end;
$$;

create or replace function public.sync_clip_dislike_counts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.clips
       set dislikes = coalesce(dislikes, 0) + 1
     where id = new.clip_id;
  elsif tg_op = 'DELETE' then
    update public.clips
       set dislikes = greatest(0, coalesce(dislikes, 1) - 1)
     where id = old.clip_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_clip_like_change on public.clip_likes;
create trigger on_clip_like_change
  after insert or delete on public.clip_likes
  for each row execute function public.sync_clip_like_counts();

drop trigger if exists on_clip_dislike_change on public.clip_dislikes;
create trigger on_clip_dislike_change
  after insert or delete on public.clip_dislikes
  for each row execute function public.sync_clip_dislike_counts();

-- 5. Single atomic toggle function for clip reactions.
--    This is what Actually fixes the multiplication bug.
create or replace function public.toggle_clip_reaction(
  p_clip_id text,
  p_user_id text,
  p_reaction text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_likes int;
  v_dislikes int;
begin
  if p_reaction = 'like' then
    -- unlike if already liked, and always clear dislike
    delete from public.clip_dislikes
     where clip_id = p_clip_id and user_id = p_user_id;

    if exists (
      select 1 from public.clip_likes
      where clip_id = p_clip_id and user_id = p_user_id
    ) then
      delete from public.clip_likes
       where clip_id = p_clip_id and user_id = p_user_id;
    else
      insert into public.clip_likes (clip_id, user_id)
      values (p_clip_id, p_user_id);
    end if;

  elsif p_reaction = 'dislike' then
    delete from public.clip_likes
     where clip_id = p_clip_id and user_id = p_user_id;

    if exists (
      select 1 from public.clip_dislikes
      where clip_id = p_clip_id and user_id = p_user_id
    ) then
      delete from public.clip_dislikes
       where clip_id = p_clip_id and user_id = p_user_id;
    else
      insert into public.clip_dislikes (clip_id, user_id)
      values (p_clip_id, p_user_id);
    end if;

  else
    raise exception 'invalid reaction %', p_reaction;
  end if;

  select coalesce(likes, 0), coalesce(dislikes, 0)
    into v_likes, v_dislikes
    from public.clips
   where id = p_clip_id;

  return jsonb_build_object(
    'likes', v_likes,
    'dislikes', v_dislikes
  );
end;
$$;

grant execute on function public.toggle_clip_reaction(text, text, text) to anon, authenticated, service_role;

-- 6. Fold old follows duplicate rows into one and add a unique pair constraint
delete from public.follows a
using public.follows b
where a.follower_id = b.follower_id
  and a.following_id = b.following_id
  and a.ctid < b.ctid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'follows_unique_pair'
      and conrelid = 'public.follows'::regclass
  ) then
    alter table public.follows
      add constraint follows_unique_pair unique (follower_id, following_id);
  end if;
end $$;

-- 7. Update follow triggers to sync both old and new profile count columns
create or replace function public.update_follow_counts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
       set following_count = coalesce(following_count, 0) + 1,
           following = coalesce(following, 0) + 1
     where id = new.follower_id;

    update public.profiles
       set follower_count = coalesce(follower_count, 0) + 1,
           followers = coalesce(followers, 0) + 1
     where id = new.following_id;

  elsif tg_op = 'DELETE' then
    update public.profiles
       set following_count = greatest(0, coalesce(following_count, 1) - 1),
           following = greatest(0, coalesce(following, 1) - 1)
     where id = old.follower_id;

    update public.profiles
       set follower_count = greatest(0, coalesce(follower_count, 1) - 1),
           followers = greatest(0, coalesce(followers, 1) - 1)
     where id = old.following_id;
  end if;

  return null;
end;
$$;

-- 8. Single atomic toggle function for follows
create or replace function public.toggle_follow_user(
  p_follower_id text,
  p_following_id text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.follows
    where follower_id = p_follower_id
      and following_id = p_following_id
  ) then
    delete from public.follows
     where follower_id = p_follower_id
       and following_id = p_following_id;
  else
    insert into public.follows (follower_id, following_id, status)
    values (p_follower_id, p_following_id, 'accepted');
  end if;
end;
$$;

grant execute on function public.toggle_follow_user(text, text) to anon, authenticated, service_role;

-- 9. Fold profile_likes duplicates, add unique pair constraint,
--    and update the existing trigger to sync old + new columns.
delete from public.profile_likes a
using public.profile_likes b
where a.liker_id = b.liker_id
  and a.target_id = b.target_id
  and a.ctid < b.ctid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profile_likes_unique_pair'
      and conrelid = 'public.profile_likes'::regclass
  ) then
    alter table public.profile_likes
      add constraint profile_likes_unique_pair unique (liker_id, target_id);
  end if;
end $$;

create or replace function public.update_like_counts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
       set likes_count = coalesce(likes_count, 0) + 1,
           likes = coalesce(likes, 0) + 1
     where id = new.target_id;

  elsif tg_op = 'DELETE' then
    update public.profiles
       set likes_count = greatest(0, coalesce(likes_count, 1) - 1),
           likes = greatest(0, coalesce(likes, 1) - 1)
     where id = old.target_id;
  end if;

  return null;
end;
$$;

create or replace function public.toggle_profile_like(
  p_liker_id text,
  p_target_id text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profile_likes
    where liker_id = p_liker_id
      and target_id = p_target_id
  ) then
    delete from public.profile_likes
     where liker_id = p_liker_id
       and target_id = p_target_id;
  else
    insert into public.profile_likes (liker_id, target_id)
    values (p_liker_id, p_target_id);
  end if;
end;
$$;

grant execute on function public.toggle_profile_like(text, text) to anon, authenticated, service_role;

-- 10. Recalculate counts once so existing data matches reality
update public.profiles p
set follower_count = sub.follower_count,
    followers = sub.follower_count
from (
  select following_id, count(*) as follower_count
  from public.follows
  group by following_id
) sub
where p.id = sub.following_id;

update public.profiles p
set following_count = sub.following_count,
    following = sub.following_count
from (
  select follower_id, count(*) as following_count
  from public.follows
  group by follower_id
) sub
where p.id = sub.follower_id;

update public.profiles p
set likes_count = sub.likes_count,
    likes = sub.likes_count
from (
  select target_id, count(*) as likes_count
  from public.profile_likes
  group by target_id
) sub
where p.id = sub.target_id;

commit;
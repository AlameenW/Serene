# Serene: user-owned courses & deadlines (Firestore migration)

## Context

Everything on the Courses page is currently hardcoded: `src/data/mockCourses.js` is a static list of 5 SLU courses, and `AppContext.jsx` seeds a fixed 15-item `INITIAL_DEADLINES` array into unscoped, global `localStorage` keys (`serene_deadlines`, `serene_completed`, `serene_mood`) — the same data shows for every browser user, there's no course CRUD, and deadlines link to a course via a raw string (`d.course === 'CMPS 479'`) rather than a real ID. Now that Google sign-in works end-to-end, the goal is to let each signed-in user create their own courses and deadlines, stored per-account so it's real and syncs across devices — not just a nicer local mock.

This touches more than Courses: Dashboard renders deadlines/course labels and the stress forecast, Support's AI chat opener references a hardcoded deadline count, and Profile turns out to already have its own fully-disconnected copy of the same fake data (found during investigation, not part of the original ask, but the same bug family — included here for consistency). Two storage decisions were confirmed with the user: **mood check-in stays in localStorage** (transient, no cross-device value), and **Profile's university/major/year fields get persisted to Firestore now** (since Profile is already being rewired to real data).

Backend choice: **Firestore**, scoped per-user under `users/{uid}/...`, since Auth already works and device-bound localStorage would undercut that.

---

## 1. Firestore data model

```
users/{uid}                                   // profile doc
  university, major, year                     // persisted from Profile edits (new)
  createdAt, updatedAt

users/{uid}/courses/{courseId}                // courseId = Firestore auto-ID
  code, name, credits, instructor
  createdAt, updatedAt

users/{uid}/deadlines/{deadlineId}            // deadlineId = Firestore auto-ID
  courseId          // stable FK -> courses/{courseId}, NOT a code string
  title, date, weight, type
  completed: boolean   // replaces the separate `completed` Set entirely
  createdAt, updatedAt
```

- **courseId replaces code-as-key.** Today `course.id` *is* the code string and deadlines match on it directly — brittle (renaming a code orphans its deadlines). Courses get a real generated ID; `code` becomes free-text display only. All `d.course === course.id` lookups become `d.courseId === course.id`.
- **Join at render time, don't denormalize.** Build `courseMap = new Map(courses.map(c => [c.id, c]))` wherever a course name/code needs to render (Dashboard, Profile). Course lists are tiny (<20 per student) so this is cheap, and avoids fan-out writes to every deadline when a course is renamed.
- **`completed` folds into the deadline doc.** Removes the existing dual-source-of-truth bug where `deleteDeadline` has to remember to also scrub a separate `completed` Set. `toggleComplete(id)` becomes `updateDoc(ref, { completed: !current })`.
- **Mood stays local-only** — no Firestore field, unchanged from today's `localStorage`/`activeMood` behavior.

## 2. Security rules (publish via Firebase console — no CLI/`firebase.json` in this repo)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /courses/{courseId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /deadlines/{deadlineId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    match /{document=**} { allow read, write: if false; }   // explicit deny-all fallback
  }
}
```
This — not the route guard in §4 — is the actual security boundary, since the client `apiKey` isn't a secret. A naive `allow read, write: if true` (common in quick-start templates) would make every user's data publicly readable/writable and must be avoided.

No composite indexes needed — reads are full-subcollection `onSnapshot` listeners sorted client-side (matching the app's existing pattern), plus a single-field `where('courseId','==',id)` for cascade-delete, which Firestore auto-indexes.

## 3. `src/lib/firebase.js` — add Firestore accessor

Follow the existing `cachedApp`/`cachedAuth` singleton pattern exactly:
```js
let cachedDb = null
export function getFirebaseFirestore() {
  const app = getOrInitApp()
  if (!app) return null
  if (cachedDb) return cachedDb
  cachedDb = getFirestore(app)
  return cachedDb
}
```

## 4. `src/lib/AppContext.jsx` — redesign around `onSnapshot`

- Pull `user` from `useAuth()`.
- Replace `deadlines`/`completed` localStorage-backed state with `useState([])` for `courses`, `deadlines`, `profile` (`{university, major, year}`), plus a `loading` boolean (`true` initially).
- One `useEffect` keyed on `user?.uid`:
  - `user == null` → reset `courses`/`deadlines`/`profile` to empty, `loading = false`, no subscriptions.
  - `user != null` → `loading = true`; subscribe with `onSnapshot` to `users/{uid}/courses`, `users/{uid}/deadlines`, and the `users/{uid}` doc itself (for `profile`); track "first snapshot received" per listener so `loading` flips `false` once all three have fired; attach an error callback per listener (`console.error` + lightweight `error` state, no retry/offline-queue logic); effect cleanup unsubscribes all three (this is what makes real sign-out in §6 actually detach listeners).
- CRUD becomes async, targeting Firestore:
  - `addCourse`, `updateCourse`, `deleteCourse` (cascade-deletes the course's deadlines first — see §6) — new.
  - `addDeadline`/`updateDeadline`/`deleteDeadline` → `addDoc`/`updateDoc`/`deleteDoc`. The module-level `let nextId = 100` counter in `Courses.jsx` is deleted — Firestore IDs replace it.
  - `toggleComplete(id)` → `updateDoc(ref, { completed: !current })`.
  - `updateProfile(fields)` → `setDoc(doc(db,'users',uid), fields, { merge: true })`.
  - Wrap each write in try/catch → non-blocking `window.alert` on failure (matches `AuthContext.jsx`'s existing error-surfacing convention), keep the input in place for retry.
- **Drop the standalone `completed` Set entirely.** Every `completed.has(d.id)` caller switches to `d.completed`.
- Exported shape: `{ courses, deadlines, profile, loading, addCourse, updateCourse, deleteCourse, addDeadline, updateDeadline, deleteDeadline, toggleComplete, updateProfile, activeMood, setActiveMood }` (`activeMood`/`setActiveMood` unchanged, still localStorage-backed).

## 5. Route protection

New `src/auth/RequireAuth.jsx`:
```jsx
export default function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}
```
In `App.jsx`, wrap `/dashboard`, `/courses`, `/support`, `/profile` in a parent `<Route element={<RequireAuth />}>`. `AuthProvider > AppProvider > Routes` ordering is unchanged (`AppContext` already needs `useAuth()`, and already sits inside `AuthProvider` today). This is a UX guard, not the security boundary — that's §2.

## 6. Fix the broken "Sign out" (all 4 pages)

Every page currently does `<Link to="/">Sign out</Link>` — it never calls `useAuth().signOut()`, so the Firebase session stays alive. This matters more now: without it, Firestore listeners in §4 never unsubscribe, and a second person on a shared device could see the first user's still-live data. Replace with:
```jsx
const navigate = useNavigate()
const { signOut } = useAuth()
async function handleSignOut() { await signOut(); navigate('/', { replace: true }) }
// <button onClick={handleSignOut} className="...">Sign out</button>
```
`Dashboard.jsx` already imports `useNavigate`; `Courses.jsx`, `Support.jsx`, `Profile.jsx` need it added.

## 7. `src/pages/Courses.jsx`

- Drop the `mockCourses` import; pull `courses, addCourse, updateCourse, deleteCourse, deadlines, addDeadline, updateDeadline, deleteDeadline, toggleComplete, loading` from `useAppState()`.
- Rename existing deadline modal state (`modal`/`form`) to `deadlineModal`/`deadlineForm` for clarity; add a parallel `courseModal`/`courseForm` pair for a new **Add/Edit Course** modal, reusing the exact modal shell already in this file.
- Add a header row above the course-cards grid ("My Courses" + "+ Add Course"), matching the pattern already used above the deadlines list.
- **Card structural fix:** cards are currently one big `<button>`. Adding hover Edit/Delete icons (matching the deadline-row pattern) means nesting buttons, which is invalid HTML — change the card's outer element to a `<div>` with an inner clickable region for selection, and sibling Edit/Delete `<button>`s.
- **Course deletion cascades**, gated behind `window.confirm` showing the exact deadline count: `Delete CMPS 479? This will also delete its 6 deadlines.`
- Deadline modal's course `<select>` sources from real `courses` (`value = courseId`, label `${c.code} — ${c.name}`).
- **Zero-courses state:** show an empty-state prompt in place of the grid ("Add your first course to start tracking deadlines" + CTA opening the Add Course modal); disable "Add Deadline" while `courses.length === 0` with an explanatory tooltip.
- Course-card score filter: `d.course === course.id` → `d.courseId === course.id`.
- Canvas LMS box: unchanged (still a disabled mock).

## 8. `src/pages/Dashboard.jsx`

- Pull `courses` and `loading` in addition to existing state.
- `courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses])`; replace both raw `d.course` renders with `courseMap.get(d.courseId)?.code ?? 'Unknown course'`.
- `activeDeadlines = deadlines.filter(d => !completed.has(d.id))` → `deadlines.filter(d => !d.completed)`.
- **Gate on `loading`:** without it, the forecast briefly computes over an empty array on first mount, flashing "all green/low stress" for a user who actually has a heavy week, before the first Firestore snapshot lands. Show a skeleton while `loading` is true.
- Empty state (`loaded && deadlines.length === 0`): add a "No deadlines yet — add one from the Courses page" message instead of silently rendering nothing.
- **`alertDismissed` is a module-level variable, not per-user state** — after adding real sign-out + route guards, if User A dismisses the stress alert then User B signs in on the same tab, User B won't see it either (same leak class as the sign-out bug). Convert to `useState`, re-initialized per mount.
- Move scoring helpers to the shared module (§10); apply the sign-out fix from §6.

## 9. `src/pages/Support.jsx` (AITab only — tightly scoped)

- Pull `deadlines` from `useAppState()`; compute an upcoming count via the shared `getUpcoming()` helper (§10) — same "next 7 days, not completed" definition Dashboard uses.
- Replace the hardcoded opener:
```js
const openingText = upcomingCount === 0
  ? `Hey ${firstName}, looks like your week is pretty clear. What's on your mind?`
  : `Hey ${firstName}, looks like you've got ${upcomingCount} deadline${upcomingCount === 1 ? '' : 's'} coming up this week. What's on your mind?`
```
- **Aside, fix while already in this file:** the navbar's "Courses" link points to the dead route `to="/forecast"` — change to `to="/courses"`.
- Not in scope: injecting deadline/course context into the Gemini system prompt — optional future stretch.

## 10. Shared scoring module — new `src/lib/stress.js`

Extracts the near-verbatim duplicated logic currently in `Dashboard.jsx`, `Courses.jsx`, and `Profile.jsx`:
```js
export function parseLocal(dateStr)
export function proximityFactor(daysUntil)
export function weightFactor(deadline)
export function computeDayScore(dayOffset, deadlines)
export function buildForecast(deadlines, activeMood)
export function courseStressScore(courseId, today, deadlines)
export function stressMeta(score)          // merged: includes `bar` (from Courses' version) alongside `dot`/`text`/`label`
export function typeCls(type)
export function formatDue(dateStr)
export function daysLabel(dateStr, today = new Date())
export function getUpcoming(deadlines, { days = 7 } = {})   // shared "next N days, not completed" filter
```
`PROX`, `MAX_PRESSURE`, `MOOD_MOD` move here as internal constants. All four consumers import from this module instead of maintaining separate copies.

## 11. `src/pages/Profile.jsx`

- Remove the hardcoded `mockDeadlines` array and its module-level (stale, load-time-only) scoring copy entirely.
- Pull `{ deadlines, courses, profile, updateProfile }` from `useAppState()`.
- Activity Summary:
  - **Deadlines** → count of upcoming, non-completed deadlines (via `getUpcoming`).
  - **Courses** → `courses.length` directly (today's `uniqueCourses` derived-from-deadlines approach undercounts any course with zero upcoming deadlines).
  - **Stress Level** → today's score via the shared module, computed in a `useMemo` (fixes the existing stale-at-module-load bug as a side effect).
- Editable fields: `university`, `major`, `year` now persist via `updateProfile()` on Save (Firestore-backed per the confirmed decision), instead of only living in local component state. `name`/`email` stay sourced from `authUser` (Google account), unchanged.
- Apply the sign-out fix from §6.

## 12. Migration / seeding

- Delete `INITIAL_DEADLINES` from `AppContext.jsx` and delete `src/data/mockCourses.js` entirely (only `Courses.jsx` imports it). Nothing to migrate — the old data was global and device-bound, not tied to any real user.
- New user's first load: all three listeners fire with empty results, `loading` becomes `false` with `courses: [], deadlines: []`.
- **No auto-seeding of fake courses/deadlines** — confirmed with user. A brand-new signed-in account should show a genuine empty state ("Add your first course"), not canned data under a real identity.

## 13. Firebase console setup (manual, one-time)

1. Firestore Database → Create database → production mode → pick a region.
2. Rules tab → paste §2's rules → Publish.
3. No composite indexes needed up front (Firestore will surface a direct console link if one's ever required later).
4. Google Sign-In provider must stay enabled (already true) — rules depend on `request.auth.uid`.

## 14. Holes / edge cases

- Route guard (§5) is UX only; §2's rules are the real boundary.
- Multi-device concurrent edits: plain last-write-wins (`updateDoc` default), no merge UI — out of scope for this app's usage pattern.
- Write failures: non-blocking alert + keep modal input intact for retry; no offline persistence/retry-queue (disproportionate for hackathon scope).
- `alertDismissed` module-level leak across accounts on a shared device (§8) — same bug class as the sign-out fix.
- Course-deletion cascade must actually delete both the deadlines and the course doc, not just detach.
- Course `code` uniqueness is intentionally not enforced.

## 15. Verification plan

1. Enable Firestore + publish rules (§13); `npm run dev`.
2. Sign in as User A → lands on `/dashboard`; confirm `RequireAuth` doesn't bounce a signed-in user.
3. Courses page: empty-state CTA renders; "Add Deadline" disabled while `courses.length === 0`.
4. Add 2–3 courses → appear immediately via `onSnapshot`, no manual refresh.
5. Add deadlines spanning near/far dates and mixed weight/type → confirm Courses' list and per-course stress bars update live.
6. Dashboard: forecast, "Next 7 Days", "All Deadlines" all reflect the new data with correctly joined course codes (not raw strings).
7. Support → AI tab: opener's deadline count matches real upcoming count, not a hardcoded "3"; "Courses" nav link goes to `/courses`.
8. Profile: Activity Summary numbers match Dashboard/Courses exactly; edit university/major/year, refresh the page, confirm they persisted.
9. Toggle a deadline complete on Courses → confirm it disappears consistently from Dashboard, Courses, and Profile counts.
10. Rename a course's code/name → confirm it updates everywhere that course's deadlines are shown (validates join-not-denormalize).
11. Delete a course with deadlines → confirm cascade count in the confirm dialog is correct, course + all its deadlines vanish everywhere; spot-check the Firestore console for no orphaned `courseId`s.
12. Sign out from each of the 4 pages → confirm real Firebase sign-out (session actually ends) and that returning to `/dashboard` afterward gets bounced by `RequireAuth`, not stale data.
13. Sign in as a **different** Google account → Dashboard/Courses/Profile are fully empty, no bleed from User A; cross-check in the Firestore console that `users/{uidA}` and `users/{uidB}` are fully separate.
14. Security check (Firebase console Rules Playground or a signed-out fetch attempt): unauthenticated read of `users/{uidA}/courses` → `PERMISSION_DENIED`.
15. Offline test: disable network, attempt to add a deadline → non-blocking alert fires, modal stays open with input intact; re-enable network, retry, confirm it syncs.

---

### Critical files
- `src/lib/AppContext.jsx` — core redesign (§4)
- `src/lib/firebase.js` — add `getFirebaseFirestore()` (§3)
- `src/lib/stress.js` — new shared scoring module (§10)
- `src/App.jsx` — route guards (§5)
- `src/auth/RequireAuth.jsx` — new (§5)
- `src/pages/Courses.jsx` — course CRUD UI (§7)
- `src/pages/Dashboard.jsx` — course join, loading/empty states, alert-leak fix (§8)
- `src/pages/Support.jsx` — AITab dynamic opener, dead-link fix (§9)
- `src/pages/Profile.jsx` — real data + persisted fields (§11)
- `src/data/mockCourses.js` — deleted (§12)

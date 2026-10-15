# Third-party sign-in (Google, Microsoft)

"Continue with Google" lets people sign in without a password. **Only Google is turned on right now.** Microsoft is built but hidden until someone sets up an Azure account for it (see [Turning Microsoft on](#turning-microsoft-on)).

## How it works

1. The person clicks **Continue with Google**. Firebase opens a popup (`signInWithPopup`).
2. When they finish, the app checks for `users/{uid}` in Firestore.
   - **First time:** it creates the profile with `name`, `email`, `role: "student"` and `createdAt`.
   - **Already exists:** it does nothing, so staff keep their role.
3. The page carries on as it does after a password login.

The Firestore rules already allow step 2 (a user may create their own `users/{uid}` as a `student`). No rules change is needed.

## Where the code is

| File | What it does |
|---|---|
| `third-party-login.ts` | Sign-in with a popup, profile creation (`ensureUserProfile`), and friendly error messages |
| `third-party-login-buttons.tsx` | The "or continue with" buttons and the error box. The `providers` list at the top controls which buttons show |
| `auth-form.tsx`, `signup-page/inline-login-card.tsx` | The places the buttons appear (`/login`, `/signup`, and the event QR page) |
| `../../lib/firebase.ts` | Creates `auth` with localStorage persistence (see Gotchas) |

## Try it on your laptop

```bash
npm run dev:restricted
```

1. Open http://localhost:3000/login (use `localhost`, not `127.0.0.1`).
2. Click **Continue with Google**. The Auth Emulator opens a fake Google sign-in.
3. Click **Add new account**, type any email (for example `auth-test@example.com`), and click **Sign in**.
4. You should land signed in. In the emulator UI, http://127.0.0.1:4000/auth lists the user and http://127.0.0.1:4000/firestore shows a `users/{uid}` document with `role: "student"`.

This uses fake data only. It proves the app code works; it does **not** prove Google is set up in the real Firebase project.

## Making it work on a real site (maintainer)

These are cloud changes, so only the maintainer does them. Repeat for each Firebase project (staging, production).

1. Firebase Console, **Authentication**, **Sign-in method**: enable **Google** and pick a support email. No client ID or secret is needed.
2. **Authentication**, **Settings**, **Authorized domains**: add the hostname of every site people will sign in on (for example the staging or production host, with no `https://` and no path). Firebase doesn't accept wildcards, so each preview host has to be added too. A missing domain makes the popup fail even when Google is enabled.
3. Make sure that deployment has the real `NEXT_PUBLIC_FIREBASE_*` values, including `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`. The `"localhost"` fallback in `lib/firebase.ts` is for the emulator only.

If a button says "This sign-in option is not turned on yet", step 1 hasn't been done for that project.

## Turning Microsoft on

The code is all there. What's missing is outside the repo:

1. Create an Azure (Microsoft Entra ID) app registration. Add the redirect URI Firebase shows you (it looks like `https://<auth-domain>/__/auth/handler`) and create a client secret.
2. In Firebase, **Sign-in method**, enable **Microsoft** and paste the client ID and secret.
3. In `third-party-login-buttons.tsx`, uncomment the `microsoft` line in `providers`.

The code uses the `common` tenant, so personal, school and work Microsoft accounts all work.

## Gotchas

- **Why `lib/firebase.ts` uses localStorage.** Firebase's default storage (IndexedDB) refuses to save the user with `Database is closing/hidden` when the popup opens as a browser tab and hides the login page. That made sign-in fail with a generic "Could not sign in". `auth` is created with `browserLocalPersistence` to avoid it. `lib/firebase.ts` is shared by many files, so keep changes to it small.
- **Popups.** Browsers may block them. The error message tells the person to allow popups.
- **Same email, different method.** If someone already has a password account and tries Google with the same email, they see "log in with your password". Accounts are not linked yet.
- **Closing the popup** shows no error on purpose.
- **Testing in tools.** The emulator's fake Google popup needs a real browser such as Chrome. A built-in preview pane that opens the popup in the same tab shows `No matching frame`.
- **Unknown errors** show the generic message. To see the real error code, temporarily add `console.error(caughtError)` in the `catch` in `third-party-login-buttons.tsx`.

# Team & Ownership

Every source file starts with an `// OWNER:` header. If this table and a file header ever disagree, the file header wins; then fix this table. GitHub enforces the same split through [`.github/CODEOWNERS`](../.github/CODEOWNERS).

## Members

| Member   | Area                                                                                    | Branch prefix    |
| -------- | --------------------------------------------------------------------------------------- | ---------------- |
| Member 1 | Customer app: browsing, booking, settings                                               | `feature/m1-...` |
| Member 2 | Provider app, onboarding/login screens (both apps), end-to-end tests                    | `feature/m2-...` |
| Member 3 | Live tracking, chat, reviews, complaints, notifications, AI features, `packages/shared` | `feature/m3-...` |
| Member 4 | Admin web, authentication, database, backend core, repo config                          | `feature/m4-...` |

## Ownership by path

| Path                                                                                                                 | Owner                                        |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Root config (`package.json`, `tsconfig.base.json`, ESLint, Prettier, `.github/`)                                     | Member 4                                     |
| `backend/src/server.ts`, `app.ts`, `routes.ts`, `config/`, `middleware/`, `utils/`                                   | Member 4                                     |
| `backend/src/db/` (models, migrations, seeders)                                                                      | Member 4                                     |
| `backend/src/modules/auth/`, `backend/src/modules/admin/`                                                            | Member 4                                     |
| `backend/src/modules/users/`, `catalog/`, `bookings/`                                                                | Member 1                                     |
| `backend/src/modules/provider/`, `jobs/`                                                                             | Member 2                                     |
| `backend/src/modules/tracking/`, `messages/`, `reviews/`, `complaints/`, `notifications/`, `ai/` (incl. `gemini.ts`) | Member 3                                     |
| `packages/shared/` (types, constants, API client)                                                                    | Member 3                                     |
| `packages/shared/src/auth/` (`AuthProvider.tsx`, `useAuth.ts`)                                                       | Member 4                                     |
| `apps/admin-web/`                                                                                                    | Member 4                                     |
| `apps/customer-mobile/app/_layout.tsx`, `index.tsx`, `(auth)/`                                                       | Member 2                                     |
| `apps/customer-mobile/app/(tabs)/`, `category/`, `providers/`, `booking/new.tsx`, `settings/`                        | Member 1                                     |
| `apps/customer-mobile/src/components/CategoryIcon.tsx`                                                               | Member 1                                     |
| `apps/customer-mobile/app/ai-triage.tsx`, `notifications.tsx`, `booking/[id]/` (track, chat, review, complaint)      | Member 3                                     |
| `apps/customer-mobile/src/components/StatusStepper.tsx`, `src/lib/api.ts`                                            | Member 3                                     |
| `apps/provider-mobile/` (everything not listed below)                                                                | Member 2                                     |
| `apps/provider-mobile/app/job/[id]/chat.tsx`, `notifications.tsx`                                                    | Member 3                                     |
| `e2e/`                                                                                                               | Member 2                                     |
| `docs/`                                                                                                              | Everyone (keep it current with your changes) |

## Rules

1. **Only edit files you own.** Ask the owner before changing anything outside your area.
2. **Changes to `packages/shared` types or the API client must go through Member 3.**
3. **Changes to database models or migrations must go through Member 4.**
4. **Work on one branch per member** (for example `feature/m1-customer`) and merge through pull requests.

### Practical notes

- Need a new shared type or endpoint function? Open an issue or PR comment tagging Member 3 and describe the shape you need.
- Need a new column or table? Ask Member 4; they write the migration so the schema stays consistent.
- Run `npm run typecheck` and `npm run lint` before opening a PR.
- Never commit `.env` files or API keys. The Gemini key lives only in `backend/.env`.

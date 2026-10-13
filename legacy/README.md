# Legacy code (pre-scaffold)

The project's first version, moved here when the TypeScript monorepo was scaffolded. It is **not** part of the npm workspaces, build, lint or typecheck.

| Folder             | What it was                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| `backend/`         | Working JavaScript Express + Sequelize API (auth, providers, service requests, reviews) with Jest tests |
| `database/`        | Sequelize migrations/seeders for that API                                         |
| `admin-dashboard/` | Empty React folder structure                                                      |
| `mobile/`          | Placeholder customer/provider apps                                                |
| `shared-types/`    | First draft of the shared types (now merged into `packages/shared`)               |

Members can copy logic from here into their new TypeScript modules. Delete this folder once nothing more is needed. It also stays in git history (commit `49a45f2`).

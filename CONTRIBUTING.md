# Contributing

## Checks

A classic search check is one rule in `src/rules/` plus its title, fix, impact and messages in every language in `src/i18n/`. It ships with tests: a site where it must fire and one where it must stay silent (`test/`). `npm test` must pass.

A check about AI search belongs in [ai-search-auditor](https://github.com/a-bibikov/ai-search-audit): this package runs those checks as they are. A check never repeats one from the other package.

If a check needs a request the shared crawl does not make, add it to `src/collect.ts`: it runs once per audit, in the same pass.

## Branches

All work goes to `dev` through pull requests. The branch name sets the release type:

| Branch | Example | PR title becomes | Release |
|---|---|---|---|
| `feat/…` | `feat/LNK-3-orphans` | `feat: …` | minor (0.1 → 0.2) |
| `fix/…` | `fix/CAN-3-trailing-slash` | `fix: …` | patch (0.1.0 → 0.1.1) |
| `docs/…` | `docs/roadmap` | `docs: …` | patch |
| `chore/…`, `ci/…`, `test/…`, `refactor/…`, `perf/…` | `ci/node-26` | `chore: …` and so on | no release (`perf` — patch) |

The prefix is added to the PR title automatically; write the rest of the title for people — it goes into the CHANGELOG. A pull request from a branch with another name fails the check.

A breaking change (report format, flags, behaviour): put `!` before the colon in the title yourself, `feat!: new JSON report format`. While the version is 0.x it raises minor, from 1.0 — major.

Merge into `dev` with **Squash and merge**: the PR title becomes the one commit on `dev`.

## Releases

1. When `dev` is ready, merge it into `main` with **Create a merge commit** (not squash: release-please needs every `feat:` and `fix:` commit).
2. The Release workflow keeps a pull request «chore(main): release X.Y.Z» with the next version and the CHANGELOG.
3. Merging it tags `vX.Y.Z`, creates the GitHub Release, publishes to npm and merges the release back into `dev`.
4. If npm holds the version in staging, approve it on npmjs.com → Staged Packages (needs 2FA).

To force a version, add a footer to a commit message: `Release-As: 0.2.0`.

Never change `version` in `package.json` by hand: release-please owns it.

When ai-search-auditor changes its engine API, raise the `peerDependencies` range in the same pull request.

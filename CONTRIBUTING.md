# Contributing

## Checks

A classic search check is one file in the folder of its group — `src/rules/idx/idx-4.ts` for IDX-4 — plus its title, short action (`todo`), fix, impact and messages in every language in `src/i18n/`.

```
src/rules/idx/
  index.ts    what the group checks, and the list of its checks in order
  shared.ts   constants and helpers several checks of the group use
  idx-1.ts    one check per file, starting with its id and title
```

A new check goes into its group's `index.ts` list. A new group is a new folder, a line in `SEO_GROUPS` and `src/rules/index.ts`, and its name in `groups` of every language. It ships with tests: a site where it must fire and one where it must stay silent (`test/`). `npm test` must pass.

A check about AI search belongs in [ai-search-auditor](https://github.com/a-bibikov/ai-search-audit). This package checks classic search only.

If a check needs a request the shared crawl does not make, add it to `src/collect.ts`: it runs once per audit, in the same pass.

## Branches

`dev` is the main branch: all work goes there through pull requests, and `main` only ever gets `dev`.

Every task starts with an issue. Name the branch after the type of the change and the issue number:

| Branch | PR title becomes | Release |
|---|---|---|
| `feat/issue-12` | `feat: …` | minor (0.6.0 → 0.7.0) |
| `fix/issue-12` or `bug/issue-12` | `fix: …` | patch (0.6.0 → 0.6.1) |
| `docs/issue-12` | `docs: …` | patch |
| `chore/`, `ci/`, `test/`, `refactor/`, `perf/` + `issue-12` | `chore: …` and so on | no release |

The PR rules check writes the type into the title and «Closes #12» into the description, so merging closes the issue; a branch with another name fails the check. Write the rest of the title for people: it goes into the release notes.

A breaking change (report format, flags, behaviour): put `!` before the colon yourself, `feat!: new JSON report format`. It is listed under «Breaking changes» in the release notes but raises only minor: a major version is made by hand.

Merge into `dev` with **Squash and merge**: the PR title becomes the one commit on `dev`.

## Releases

1. When `dev` is ready, open a pull request from `dev` into `main` and merge it with **Create a merge commit**. Nothing else can be merged into `main`.
2. The Release workflow reads the commits since the last tag. If there is a `feat`, `fix` or `docs` among them, it releases at once: tags `vX.Y.Z`, creates the GitHub Release with the notes, publishes to npm.
3. If npm holds the version in staging, approve it on npmjs.com → Staged Packages (needs 2FA).

**A major version** is made by hand: Actions → Release → Run workflow on `main` with «major» on.

**If publishing failed:** Run workflow with «tag» set to the existing tag, for example `v0.7.0`: it publishes that tag and makes nothing new.

The version lives in the tags. `package.json` in the repository says `0.0.0-development`: the release writes the real version into its own commit, which the tag points to, so `main` only ever gets merges from `dev`. Never change the version by hand.

The crawl, the HTML parser, the scoring and the report live in [auditor-engine](https://github.com/a-bibikov/auditor-engine): a change there is released first, then the `auditor-engine` range here is raised.

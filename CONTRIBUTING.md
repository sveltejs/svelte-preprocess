# Contributing

PRs for issues are welcome. Before pushing the code, make sure that linting and tests pass.

Commit pattern: conventional commit (`docs/feat/fix/chore: ..`) (https://www.conventionalcommits.org/en/v1.0.0/)
Changelog pattern: conventional-changelog tool to generate the changelog (https://github.com/conventional-changelog/conventional-changelog)

The publishing process is manual right now, so the current workflow is:

- Merge to main
- Checkout to main
- run npm run patch | minor | major - this will update the changelog, bump the package.json and create the release tag
- run npm publish (maybe 2fa will be asked here)

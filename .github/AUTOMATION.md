# Repository automation

All code changes go through pull requests. Draft PRs skip expensive CI; mark a PR ready to validate its latest revision. Superseded PR runs cancel. Documentation-only changes skip product checks; no paid runner waits or duplicate main-branch validation.

Prepare a release by opening a PR with the version bump and release notes. A manual merge or an explicit instruction to a local agent to release authorizes publication after all required checks pass. “Prepare a release” stops at the PR. Never bypass checks or automatically merge dependency or release PRs. Repositories without a publishing destination do not need artificial releases.

Routine dependencies are grouped weekly; security updates remain immediate. Production schedules and existing external publishing approval gates remain in force.

Use the **Prepare release** Action (release-please.yml) on main to create or update the version/changelog PR. Preparation opens a draft PR. You or a local LLM marks it ready using your own gh identity to start PR checks; bot-token events do not start other workflows. Merge only after Required CI passes. Merging the version PR builds the GitHub release; Chrome Web Store submission retains its separate environment approval.

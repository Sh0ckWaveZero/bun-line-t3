# LINE OAuth diagnostic scripts

The scripts below are historical troubleshooting utilities. Inspect their source
and the current application configuration before using them; they do not prove
that a login flow works or that a production configuration is safe.

- `scripts/monitoring/check-line-oauth.sh <domain>` requests `/api/health` and
  `/api/debug/line-oauth`. The debug endpoint may be unavailable or restricted;
  the script prints its response, so do not publish output containing sensitive
  information.
- `scripts/secrets/generate-github-secrets.sh <domain>` writes a local text
  file with suggested configuration. Review the script and keep generated
  secrets out of Git, logs, and shared channels.
- `scripts/devops/deploy-oauth-fix.sh` is a historical branch-specific helper
  that can switch branches, merge and push. Do not use it as a general deploy
  command. Follow [the current deployment guide](../docs/DEPLOYMENT.md).

See [LINE login setup](../docs/LINE_LOGIN_BOT_CHANNEL_SETUP.md) and
[account linking](../docs/LINE_ACCOUNT_LINKING.md) for related context. Verify
callback URLs and settings against the current LINE Console and environment.

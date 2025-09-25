# Security Policy

## Supported Versions
Security fixes are applied to the `main` branch and backported to the latest tagged release. Older releases may not receive patches; upgrade to the newest release for the latest security updates.

## Reporting a Vulnerability
- Email `security@deliveryapp.example` with a detailed report, including steps to reproduce and potential impact.
- Please do not disclose vulnerabilities publicly until we have confirmed and released a patch.
- We aim to acknowledge reports within 48 hours and provide a remediation plan within 7 days.

## Handling Process
1. Triage incoming report and assess severity.
2. Reproduce the issue and develop a fix in a private branch.
3. Run tests, security scans, and obtain peer review.
4. Release a patched version and update documentation/changelogs.
5. Credit the reporter (with permission) in release notes.

## Best Practices
- Never commit secrets; use environment variables and secret managers.
- Enable HTTPS/TLS in production and restrict access to internal dashboards (Prometheus/Grafana).
- Rotate JWT and cookie secrets regularly.
- For database backups, use encrypted storage and secure transport.
- Follow secure coding guidelines outlined in the project docs.


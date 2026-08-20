# Connector and OAuth Boundary

## Supported Connector Foundation

The application will expose an approval-first connector foundation for **GitHub**, **Google Calendar**, and **Gmail**. Each card identifies the planned provider, requested read-first scope category, connection state, and the requirement for a server-side OAuth client configuration. A provider is never shown as connected solely because the app contains a card for it.

| Provider | Initial Intended Access | OAuth Boundary | Action Policy |
| --- | --- | --- | --- |
| **GitHub** | Basic user profile and repository context. | OAuth client credentials and a fixed HTTPS redirect URI are required; public-profile access can request a minimal `read:user` scope. GitHub documents that scopes constrain token access and advises consideration of GitHub Apps for fine-grained repository permissions.[1] | Reading is proposed through the approval sheet; repository writes, publishing, deployment, invitation, and credential-related actions are blocked in the MVP. |
| **Google Calendar** | Calendar event summaries, free/busy context, and user-requested reads. | A registered OAuth client, authorized redirect URI, PKCE, server-side state verification, and an approved Google consent configuration are required.[2] | Read requests require a visible confirmation; event creation, modification, or sharing are blocked in the MVP. |
| **Gmail** | User-requested mailbox search and draft context. | A registered OAuth client, configured consent screen, PKCE, secure token storage, and scope verification are required.[2] | Read requests require a visible confirmation; sending, deleting, forwarding, or modifying labels are blocked in the MVP. |

## Approval Policy

No connector action may issue an external request before the user has seen an approval sheet that includes the provider, action verb, relevant account effect, requested scope category, and risk classification. The sheet differentiates **read**, **write**, **publish**, **destructive**, and **financial** actions. An approval is one-time for an individual proposed action; it does not become a blanket grant.

The current implementation uses the authorization-code pattern with PKCE as the required production protocol. Authorization URLs, verifier material, CSRF state, tokens, and refresh tokens must remain server-side. The app must use exact allow-listed redirect URIs and must not carry access tokens in query parameters.[3] In particular, Google’s installed-app documentation notes that apps must identify needed scopes, use a code verifier and challenge, and match a registered redirect URI; its provider requirements for Android require an additional implementation decision rather than use of an arbitrary custom URI scheme.[2]

## Deliberate Limitations

The project does not yet have provider OAuth client IDs, client secrets, a stable deployed HTTPS callback domain, per-user encrypted token persistence, or completed provider verification. Therefore, the visible connector foundation will treat connection attempts as **configuration-required** and will not launch a deceptive or incomplete authorization flow. The next production increment requires provider-specific credentials, a domain, a token-encryption key, authenticated ownership records, explicit retention rules, callback and token-exchange routes, revocation, and tests against sandbox provider accounts.

## References

[1]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps "Scopes for OAuth apps — GitHub Docs"
[2]: https://developers.google.com/identity/protocols/oauth2/native-app "OAuth 2.0 for iOS & Desktop Apps — Google for Developers"
[3]: https://datatracker.ietf.org/doc/rfc9700/ "RFC 9700: Best Current Practice for OAuth 2.0 Security"

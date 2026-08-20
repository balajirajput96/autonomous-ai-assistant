# OAuth Connector Design Notes

## Verified Security Constraints

The connector foundation uses the authorization-code flow with PKCE, strict pre-registered redirect URIs, provider-bound state, and server-side token exchange. RFC 9700 advises clients to avoid arbitrary redirect forwarding, prevent CSRF, prefer authorization codes over front-channel access tokens, and avoid carrying access tokens in URI query parameters.[1]

GitHub’s OAuth documentation states that scopes constrain the access an OAuth token can exercise and do not grant permissions beyond those the user already holds. Its documentation also notes that GitHub Apps use fine-grained permissions and should be considered where that model is appropriate.[2]

Google's native-app guidance requires an app to configure authorization credentials and identify its scopes in advance. It describes a unique code verifier and S256 code challenge per authorization request and requires the redirect URI to exactly match one registered for the OAuth client; it also warns that Android custom URI schemes are not supported for this flow.[3]

## Product Decision

The mobile MVP will implement **connector cards plus a pre-execution approval sheet**, not a fake completed OAuth exchange. GitHub, Google Calendar, and Gmail are represented as provider definitions with explicit read-first scopes, redirect and secret configuration requirements, and high-risk write or publish actions requiring a second user confirmation. Tokens will never be collected in a mobile text field, embedded in the app, or represented as connected before a server-side OAuth callback verifies the state and token exchange.

## References

[1]: https://datatracker.ietf.org/doc/rfc9700/ "RFC 9700: Best Current Practice for OAuth 2.0 Security"
[2]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps "Scopes for OAuth apps — GitHub Docs"
[3]: https://developers.google.com/identity/protocols/oauth2/native-app "OAuth 2.0 for iOS & Desktop Apps — Google for Developers"

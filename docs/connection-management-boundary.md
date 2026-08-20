# Connection Management and Revocation Boundary

## Lifecycle Labels

The settings interface differentiates **Configuration required**, **Local approval recorded**, **Active**, **Expired**, **Revoked**, and **Disconnected**. Each label has a distinct operational meaning so users do not confuse a local review step with a provider-granted OAuth connection.

| State | Meaning in the Application | Settings Action |
| --- | --- | --- |
| **Configuration required** | The provider client credentials, fixed callback URI, secure state store, or token store are unavailable. | Show requirements and the provider boundary; do not offer a false connect action. |
| **Local approval recorded** | The user reviewed a proposed scope/action locally, but no provider authorization page was opened and no token exists. | Offer **Remove local approval** only. This does not contact the provider. |
| **Active** | A future server-verified OAuth callback has stored a valid token reference for the signed-in user. | Display provider, account label, grants, connection date, and expiry; offer **Revoke connection**. |
| **Expired** | A stored connection exists but requires reauthorization. | Offer **Reconnect** after reauthentication controls are implemented. |
| **Revoked** | A server-side revocation transaction has succeeded and the stored token reference has been invalidated. | Allow removal of the local status record. |
| **Disconnected** | No active provider access remains. | Show a neutral disconnected state. |

## Revocation Rule

A mobile UI must never mark a connection as revoked merely because a user dismissed a dialog or cleared a local approval record. For an active OAuth connection, production revocation requires a signed-in user, an ownership check, a server-side encrypted token reference, a provider-specific revocation or deletion flow where available, audit logging, and an idempotent server response. Only after that transaction succeeds may the server return the **Revoked** state.

The current MVP has no active token store and cannot reach provider revocation endpoints. Therefore, it implements **local-approval removal** rather than falsely labelling it as OAuth revocation. The settings interface reserves the active-connection revocation surface for the future server-verified lifecycle. This follows OAuth security guidance to treat authorization artifacts and redirects as security-sensitive, server-side concerns.[1]

## References

[1]: https://datatracker.ietf.org/doc/rfc9700/ "RFC 9700: Best Current Practice for OAuth 2.0 Security"

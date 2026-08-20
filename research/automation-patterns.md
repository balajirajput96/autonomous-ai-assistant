# Automation Patterns

## Finding

Mobile applications are suitable as workflow controls and task viewers, but persistent execution belongs to a verified server-side runtime. Android’s WorkManager is appropriate for reliable deferrable tasks such as synchronization, but Android states that it is not a general solution for all immediate work. [1]

| Pattern | Use Case | Safety Controls |
| --- | --- | --- |
| Manual task | User submits a request from chat. | Validate request, classify risk, show task state. |
| Deferred client sync | Refresh local task history or upload non-sensitive state. | Network constraints, bounded retries, cancellation. |
| Scheduled server workflow | A recurring analysis or authorised action. | Stored policy, server health check, run history, pause, cancellation, and explicit user-visible schedule. |
| Event-driven workflow | An authorised webhook starts a task. | Source verification, signature validation, idempotency key, queue, audit event. |

## Product Decision

The MVP will model workflow states and policy but will not claim persistent workflows are active. A future worker must support `QUEUED`, `RUNNING`, `WAITING`, `RETRYING`, `BLOCKED`, `COMPLETED`, `FAILED`, and `CANCELLED` states, bounded retries, and a cancellation path.

## References

[1]: https://developer.android.com/develop/background-work/background-tasks/persistent "Android Task Scheduling"

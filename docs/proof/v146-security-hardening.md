# v146 security and reliability hardening

This release addresses the nine findings reported against revision `ed1fb0d3a61e98a6ceaf5f50e345def730cd9bd1`. The fixes were reconciled against the current application rather than applied only to the reviewed snapshot.

| Finding | Resolution | Regression evidence |
| --- | --- | --- |
| S1 · forwarding-header trust | The server trusts forwarding data only from a private, loopback or explicitly configured proxy peer, then walks the chain from right to left to find the first untrusted client address. Caller-controlled leading values cannot rotate the rate identity. | `rate identity ignores spoofed leading forwarding values...` |
| S2 · capacity race | Desk and match-run capacity plus per-client rate reservations occur synchronously before request-body reads. Abort and validation paths release provisional reservations. | Two six-held-body concurrency tests |
| S3 · rate-map growth | `RateTable` prunes expired identities on the service timer and every reservation, enforces a 1,024-key ceiling and refuses new identities at the ceiling. | Bounded-table and independent-pruning test |
| S4 · SSE fan-out | Match streams allow three subscribers per run and twelve across the replica. Slots are reserved before SSE headers and released once on close. | Per-run/global subscriber test |
| S5 · checkpoint retention | Checkpoints receive a twenty-four-hour application retention deadline. Expired production records are deleted. `infra/storage-retention.bicep` declares a two-day Blob lifecycle rule for `intelligence/agents/`. | Application-expiry and infrastructure-policy test |
| F1 · recap race | Every checkpoint explanation is placed on a per-run promise queue. Full time completes only after all earlier checkpoints publish. | Reversed-latency ordered-completion test |
| F2 · abandoned desk work | Ordinary desk requests receive an abort signal. Disconnect removes the listener, cancels model fetches when no listener remains, and releases the global stream slot immediately. Durable production work keeps its separate recovery policy. | Disconnect/capacity-release test |
| F3 · allowance leakage | Narrative, desk and vision paths obtain the managed-identity token before reserving daily model allowance. The same ordering now covers measured video, evidence planning and grounded handoffs. | Injected identity-failure test with zero reservations |
| F4 · stale evaluation hash | The evaluation helper recursively resolves the complete local import graph from `scripts/evaluate-agents.mjs`. The current manifest includes model access, checkpoint storage, streaming and grounded-agent dependencies. | Transitive-manifest test |

## Boundaries

The application rate limits remain in-memory and apply per running replica. The deployed prototype is configured for one replica. A scaled production service should move rate accounting to a shared store or API Management. Private proxy ranges are trusted because Azure Container Apps terminates ingress before the application; deployments with a different network path must set `BTR_TRUSTED_PROXY_IPS` or replace the policy with the platform's verified client-identity header.

The Blob lifecycle rule is infrastructure as code and must also be verified on the live storage account. Applying it replaces the account's management policy, so the live policy must be inspected before deployment to preserve any unrelated rules.

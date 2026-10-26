# States on screenshots

Every list and request of every screen, and the screenshot (`screens/<name>--*.png`) that
shows each of its states. Kept next to the paths; the design critic checks it.

| Screen · element | Loading | Empty | Error | Offline | In progress | Done |
|---|---|---|---|---|---|---|
| Sign in · form | — | 01-sign-in | 04-wrong-password | unreachable: signing in needs the network, the form is the same | 04b-signing-in | 05-conversations |
| Sign up · form | — | 02-sign-up | 03b-wrong-code | unreachable: as sign in | — | 03-code |
| Sign up · code | — | 03-code | 03b-wrong-code | — | 03-code (countdown) | 03c-resend |
| Conversations · list | 05b-conversations-loading | unreachable: every family member already has an account | 07b-offline-list | 07b-offline-list | — | 05-conversations |
| Conversation · messages | 06b-thread-loading | 03d-empty-thread | unreachable: the server refuses reads only for a missing person (08 shows not found) | 07-offline | — | 06-thread, 09-just-sent |
| Conversation · wrong address | — | — | 08a-conversation-not-found | — | — | — |
| Any wrong page | — | — | 08-not-found | — | — | — |

# States on screenshots

Every list and request of every screen, and the screenshot (`screens/<name>--*.png`) that
shows each of its states. Kept next to the paths; the design critic checks it.

| Screen · element | Loading | Empty | Error | Offline | In progress | Done |
|---|---|---|---|---|---|---|
| Home · account controls | 03b-home-loading (no controls until the account is known) | 01-home-stranger | — | 03c-home-offline (the account is unknown: the stranger's Sign In) | — | 03-home-signed-in |
| Sign in · form | — | 02-sign-in | 02b-wrong-password | unreachable: signing in needs the network, the form is the same | — | 03-home-signed-in |
| Any wrong page | — | — | 04-not-found | — | — | — |

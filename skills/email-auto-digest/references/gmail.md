# Gmail API guide

## Access
- Use OAuth with Gmail scopes (minimum):
  - `https://www.googleapis.com/auth/gmail.readonly`
- For labeling or modifying, use `.../gmail.modify` only if needed.

## Common endpoints
- List messages: `users.messages.list` with `q` and `labelIds`
- Get message: `users.messages.get` with `format=full` or `metadata`
- Batch requests are recommended for throughput.

## Query patterns
- Time range: `after:YYYY/MM/DD before:YYYY/MM/DD`
- Unread: `is:unread`
- Label: `label:inbox` or label id
- Sender: `from:example@domain.com`

## Normalization tips
- Use `threadId` to group conversations.
- Parse headers for `From`, `To`, `Cc`, `Subject`, `Date`.
- Prefer `payload.parts` for text/plain; fallback to html if needed.

## Incremental sync
- Track `historyId` and use `users.history.list` for deltas.
- Fallback to date-based searches if history expires.

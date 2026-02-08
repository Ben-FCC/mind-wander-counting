# Microsoft Graph (Outlook/M365) guide

## Access
- Use OAuth with Microsoft Graph delegated permissions:
  - `Mail.Read` (minimum)
  - `Mail.ReadBasic` for metadata-only scenarios

## Common endpoints
- List messages: `GET /me/messages?$top=...&$select=...&$orderby=receivedDateTime desc`
- Filter: `?$filter=receivedDateTime ge 2024-01-01T00:00:00Z`
- Search: `?$search="subject:invoice"` (requires `ConsistencyLevel: eventual`)
- Delta sync: `GET /me/messages/delta`

## Normalization tips
- Use `conversationId` for thread grouping.
- Use `bodyPreview` for quick summaries, `body.content` for full text.
- Capture `receivedDateTime`, `from`, `toRecipients`, `ccRecipients`, and `webLink`.

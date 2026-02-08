---
name: email-auto-digest
description: "Automate reading, summarizing, and organizing email inboxes. Use when asked to connect to Gmail/Outlook/IMAP, fetch messages, extract key fields, categorize threads, and produce summaries, action lists, alerts, or structured reports from emails."
---

# Email Auto Digest

## Workflow
1. Confirm scope: accounts, folders/labels, time range, and whether attachments should be processed.
2. Pick the access method and follow the matching guide:
   - Gmail API: see [references/gmail.md](references/gmail.md)
   - Microsoft Graph (Outlook/M365): see [references/outlook.md](references/outlook.md)
   - IMAP: see [references/imap.md](references/imap.md)
3. Obtain credentials securely and avoid storing secrets in code or logs.
4. Fetch messages with pagination and rate-limit handling; prefer incremental sync (e.g., history or delta queries).
5. Normalize data into a consistent schema (message_id, thread_id, from, to, subject, date, body_text, body_html, attachments, labels/folders, links).
6. Clean content: strip signatures/quoted replies, collapse threads, and de-duplicate forwarded content.
7. Extract structured info (deadlines, amounts, meeting times, action requests, URLs) and infer priority.
8. Summarize by thread, sender, and topic. Group related items and highlight urgent or overdue tasks.
9. Output results in the requested format; default to the template in [references/output-templates.md](references/output-templates.md).

## Output expectations
- Provide a short executive summary plus a detailed breakdown.
- Include action items with owners and due dates when inferred.
- Flag emails requiring immediate response or follow-up.
- Include links to source emails when possible.

## Safety and privacy
- Never transmit or store email content outside the approved destination.
- Redact sensitive data in logs and examples.
- Do not send, reply, or delete emails unless explicitly requested.

## If information is missing
- Ask the user for the provider, auth method, and preferred output format.
- Ask whether attachments should be parsed and what file types are allowed.

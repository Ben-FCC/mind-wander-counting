# IMAP guide

## Access
- Use IMAP over SSL (port 993) with app passwords if required.
- Prefer providers' OAuth flows when available.

## Workflow
1. Connect and authenticate.
2. Select mailbox (INBOX or named folder).
3. Search by date, flags, or sender.
4. Fetch headers + body (`RFC822`) and parse with a mail parser.

## Parsing tips
- Prefer text/plain; fallback to text/html.
- Normalize time zones to ISO 8601.
- Use `Message-ID` and `References` for threading.

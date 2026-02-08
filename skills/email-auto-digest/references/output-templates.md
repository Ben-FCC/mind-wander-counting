# Output templates

## Markdown summary template
```
# Email Digest (TIME RANGE)

## Executive summary
- Key themes:
- Total emails processed:
- Urgent items:

## Action items
| Priority | Owner | Task | Due | Source |
| --- | --- | --- | --- | --- |
| High |  |  |  |  |

## Alerts
- [ ] Overdue or time-sensitive items
- [ ] Security or billing notices

## By sender
### sender@domain.com
- Topics:
- Notable requests:
- Follow-ups needed:

## By thread/topic
### Topic
- Summary:
- Next step:
- Source links:
```

## JSON schema (optional)
```
{
  "time_range": "",
  "summary": {
    "themes": [],
    "total_emails": 0,
    "urgent_count": 0
  },
  "actions": [
    {
      "priority": "high|medium|low",
      "owner": "",
      "task": "",
      "due": "",
      "source": ""
    }
  ],
  "alerts": [],
  "by_sender": [
    {
      "sender": "",
      "topics": [],
      "notes": ""
    }
  ],
  "by_thread": [
    {
      "topic": "",
      "summary": "",
      "next_step": "",
      "source": ""
    }
  ]
}
```

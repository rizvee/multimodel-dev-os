# Operator Skill: Inbox Triage

## Purpose
Organize provided message excerpts into draft triage buckets.

## When To Use
Use when a maintainer provides copied message text, subject lines, or a mailbox export and wants a draft prioritization.

## Required Input
- Message excerpts or summaries
- Any known priority rules
- Optional labels or categories

## Safe Output
- Draft priority buckets
- Suggested labels
- Reply-needed notes
- Open questions

## Permission Class
draft-only

## Constraints
- Work only from provided text.
- Do not access mailboxes or external systems.
- Do not send, archive, label, forward, or delete messages.
- Do not include private examples in reusable templates.

## Verification Checklist
- Separate urgent, needs reply, waiting, and FYI items.
- Mark uncertain priority as an open question.
- Avoid inventing facts not present in the input.

## Next Action
Ask the maintainer to review the draft before taking any external action.

## Safety Boundary
This skill drafts, summarizes, or structures information only.
It does not send messages, update systems, publish content, spend money, or perform external writes.

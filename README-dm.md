# Direct Messaging (DM) Overview

This document describes the data model and API flows for the direct messaging
feature. The implementation uses Supabase Postgres with row level security and
realtime channels.

## Schema
- **dm_conversations** – container for a 1:1 conversation.
- **dm_members** – membership rows with `state` (`active` or `pending`) and
  `last_read_at` for read receipts.
- **dm_messages** – individual messages with optional `attachments` metadata.

See `supabase/migrations/20250902000001_dm_messaging.sql` for full SQL including
indexes, RLS policies and RPC helpers (`dm_start`, `dm_set_request`,
`dm_mark_read`).

## Requests flow
Starting a conversation with a private account creates the conversation with the
target user in `pending` state. The target may accept or decline the request via
`dm_set_request`. Declining removes their membership and deletes the
conversation if no members remain.

## API helpers
Client-side helpers are provided in `src/lib/dm.ts`:
- `startConversation` – invoke `dm_start` RPC.
- `fetchThreads` – list conversations for inbox or requests.
- `fetchMessages` – load messages for a conversation.
- `sendMessage` – insert a new message.
- `markThreadRead` – update `last_read_at`.

## UI components
Placeholder UI components live under `src/components/dm/` including:
`ThreadsList`, `ConversationView`, `DMComposer`, `RequestBanner` and
`TypingIndicator`. Pages `/messages` and `/messages/requests` wire these together
using React Router.

Further work is needed to support attachments, realtime updates, typing
indicators and full request workflows.

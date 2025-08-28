# Comments API

This project implements threaded comments with cursor-based pagination using Supabase.

## Endpoints

### `POST /api/comments`
Create a new comment. Body parameters:
- `postId`: string
- `body`: string (<=1000 chars)
- `parentId` (optional): string – parent comment id for replies.

### `GET /api/comments?postId=...&cursor=...&limit=20`
Fetch top-level comments for a post. Returns newest comments first and includes up to two preview replies.

### `GET /api/comments/:id/replies?after=...&limit=20`
Fetch replies for a comment in ascending order starting after the provided cursor.

### `PUT /api/comments/:id`
Edit a comment. Body: `{ body: string }`.

### `DELETE /api/comments/:id`
Soft delete a comment – sets `is_deleted=true` and clears body.

### `POST /api/comments/:id/like`
Toggle like for the current user. Returns `{ like_count, did_like }`.

## Pagination
- Top-level comments use `created_at` cursor in descending order.
- Replies use `created_at` cursor in ascending order.

## Safety Filters
SQL functions exclude comments from users that the viewer has blocked or muted using the `blocks` and `mutes` tables.

## Database
See `supabase/migrations/20250828090000_comments_system.sql` for full schema, RLS policies and RPC helpers.

# Security Specification: Aura Agenda Smart

## 1. Data Invariants
1. **User Scoping & Isolation**: Every document in `/users/{userId}` and its subcollections (`events`, `tasks`, `memos`, `syncLogs`) strictly belongs to the authenticated user matching `{userId}` (`request.auth.uid == userId`). No user may read, list, create, modify, or delete another user's agenda items.
2. **Identity Integrity**: In all subcollection documents, `incoming().userId == request.auth.uid`. Cross-user identity spoofing is strictly rejected.
3. **Immutability of Identity & Creation**: `userId`, `id`, and `createdAt` cannot be changed during an update (`incoming().userId == existing().userId && incoming().id == existing().id && incoming().createdAt == existing().createdAt`).
4. **Boundary Limits**: Strings and collections must not exceed max lengths defined in the blueprint (e.g. title <= 256, descriptions <= 2048, memos <= 5000) to prevent Denial-of-Wallet attacks.
5. **Strict Allowed Keys**: Updates and creates must not accept undocumented shadow keys or privileges.

## 2. The Dirty Dozen Payloads (Targeting Firestore Rules)
1. **Payload 1: Unauthenticated Read**: Anonymous/unauthenticated request attempting `get(/users/user_123/events/event_1)`. Expected: PERMISSION_DENIED.
2. **Payload 2: Cross-User Read**: User B attempting `get(/users/user_A/events/event_1)`. Expected: PERMISSION_DENIED.
3. **Payload 3: Cross-User List Query**: User B querying `list(/users/user_A/tasks)`. Expected: PERMISSION_DENIED.
4. **Payload 4: Identity Spoofing on Create**: User A attempting to create event in `/users/user_A/events/e1` with `{ userId: 'user_B' }`. Expected: PERMISSION_DENIED.
5. **Payload 5: Malicious Foreign Path Injection**: User A attempting to create `/users/user_B/tasks/t1` with `{ userId: 'user_A' }`. Expected: PERMISSION_DENIED.
6. **Payload 6: Oversized Payload (Denial-of-Wallet)**: User A attempting to create a task with a 50KB title string (> 256 chars). Expected: PERMISSION_DENIED.
7. **Payload 7: Shadow Field Injection**: User A attempting to update a task adding `{ isAdmin: true, role: 'superadmin' }`. Expected: PERMISSION_DENIED.
8. **Payload 8: Creation Immutability Tamper**: User A attempting to update `createdAt` timestamp to arbitrary past date. Expected: PERMISSION_DENIED.
9. **Payload 9: Malicious ID Injection**: User A targeting path `/users/user_A/events/<1500 chars of junk!@#>`. Expected: PERMISSION_DENIED.
10. **Payload 10: Missing Required Fields**: User A creating an event missing `title`, `startTime`, or `endTime`. Expected: PERMISSION_DENIED.
11. **Payload 11: Invalid Enum Tampering**: User A setting task priority to `"super_p0_bypass"`. Expected: PERMISSION_DENIED.
12. **Payload 12: Blank Document Hijack**: User A writing to root collection `/users` with empty doc ID or wildcard collection. Expected: PERMISSION_DENIED.

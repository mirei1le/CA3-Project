# v0 baseline notes

v0 is the working application before dedicated security hardening. This file records what v0
includes and what is deliberately left for v1, so the v0 to v1 comparison in the report starts
from a clear baseline. It also lists the initial attack surface that the brief asks for in the
planning phase.

**v0 must only be run locally with the demo data.**

## Scope

A student portal with three roles (student, lecturer, admin). Critical flows:

1. A user logs in and reaches their dashboard.
2. A student uploads an assignment submission.
3. A lecturer grades a submission.
4. A student views their grades and feedback.
5. An admin creates a user or changes a user's role.

## What v0 already does

These are basics that came with the generated application, not the result of a security
requirement. They still need to be verified like everything else.

- Passwords are hashed with bcrypt (cost factor 10) before they are stored.
- Every page except the login page requires a logged-in session.
- Pages are restricted by role: `/admin/*` to admins; posting announcements, managing
  assignments and grading to lecturers and admins; uploading work and the grades page to students.
- Page templates use EJS's escaped output (`<%= %>`).
- Sessions are stored on the server (in MongoDB); the browser only holds the session ID cookie.

## What v0 does not do yet (planned for v1)

Each item maps to the security story that will own it.

| Area | Not in v0 | Story |
| --- | --- | --- |
| Authentication | No limit on failed login attempts; no password strength rules; bcrypt rather than Argon2id | SEC-01 |
| Session management | No inactivity or absolute timeout; session ID is not renewed at login; cookie settings are the library defaults; logout is a plain link; no CSRF tokens on forms | SEC-02 |
| Authorisation | Role checks only. No per-record ownership checks: routes that take a record ID (module, assignment, announcement, submission) do not check that the record belongs to the logged-in user's modules. No deadline check when a submission is replaced | SEC-03 |
| Data protection | Personal details (phone, address, date of birth) are stored as plain text; the session secret has a built-in default value | SEC-04 |
| Input validation | No server-side validation of types, lengths or formats; request values are passed to database queries as received; search text is used directly as a search pattern; no security headers or Content Security Policy | SEC-05 |
| File upload | No restriction on file type or size; files keep the name the user gave them (with a time prefix) | SEC-05 |
| Error handling | No central error handler: unexpected errors fall through to Express's default handler; `NODE_ENV` is not set | SEC-06 |
| Logging | No security event logging; only start-up messages are printed | SEC-06 |
| Configuration | MongoDB runs without authentication and its port is published by Docker Compose | Not assigned yet |

## Initial attack surface

| Entry point | Routes |
| --- | --- |
| Login and logout | `GET/POST /login`, `GET /logout` |
| Profile and password | `GET/POST /profile`, `POST /profile/password` |
| Module pages and search | `GET /modules`, `GET /modules/:id` |
| Announcements | `POST /modules/:id/announcements`, `GET /announcements/:id/edit`, `POST /announcements/:id`, `POST /announcements/:id/delete` |
| Assignments | `GET /modules/:id/assignments/new`, `POST /modules/:id/assignments`, `GET /assignments/:id`, `GET /assignments/:id/edit`, `POST /assignments/:id`, `POST /assignments/:id/delete` |
| File upload and download | `POST /assignments/:id/submit`, `GET /submissions/:id/download`, `POST /submissions/:id/delete` |
| Grading | `POST /submissions/:id/grade`, `GET /grades` |
| User administration and search | `GET /admin/users`, `GET /admin/users/new`, `POST /admin/users`, `GET /admin/users/:id/edit`, `POST /admin/users/:id`, `POST /admin/users/:id/delete` |
| Module administration | `GET /admin/modules/new`, `POST /admin/modules`, `GET /admin/modules/:id/edit`, `POST /admin/modules/:id`, `POST /admin/modules/:id/delete` |
| Infrastructure | Web server on port 3000, MongoDB on port 27017, the `uploads` folder |

## Functional test status

`test/smoke.js` (33 checks) passed against v0 on 12 November 2026. Re-run it on v1 and v2 to show
that the security changes did not break normal behaviour (regression testing).

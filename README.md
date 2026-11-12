# CA3-Project: Student Portal

A student portal web application built for the DFCS H4013 Application Security CA3 project.
Students view their modules, announcements and grades and upload assignment work. Lecturers post
announcements, set assignments and grade submissions. Admins manage users and modules.

All data in the application is synthetic demo data.

## Versions

The project follows a Secure Software Development Life Cycle with three versions, each kept on its
own branch:

| Branch | Version | State |
| --- | --- | --- |
| `v0` | AI-developed baseline | Working application **before** dedicated security hardening |
| `v1` | AI-secured | After prompting AI to implement the documented security requirements |
| `v2` | Verified / remediated | After testing, justified remediation and regression testing |

This is **v0**. It is not hardened and must only be run locally. See
[docs/V0_BASELINE.md](docs/V0_BASELINE.md) for what it does and does not include, and
[docs/AI_USAGE.md](docs/AI_USAGE.md) for the record of how AI was used to build it.

## Features

| Area | Student | Lecturer | Admin |
| --- | --- | --- | --- |
| User accounts | View and update own profile, change password | Same | Create, view, update, delete users; assign roles |
| Modules | View enrolled modules | View modules they teach | Create, view, update, delete modules; enrol students |
| Announcements | Read | Create, update, delete | Create, update, delete |
| Assignments | Read | Create, update, delete | Create, update, delete |
| Submissions | Upload, download, replace, delete own file | Download and grade | Download and grade |
| Grades | View own grades and feedback | Give grades and feedback | Give grades and feedback |

## Technology

- Node.js with Express 5 (server) and EJS (server-rendered pages)
- MongoDB with Mongoose (database)
- express-session with connect-mongo (login sessions stored in MongoDB)
- Multer (file uploads), bcryptjs (password hashing)
- Docker Compose (runs the app and the database together)

## Running the application

New to the project? Follow the step-by-step [SETUP.md](SETUP.md) instead.

### Option 1: Docker (recommended)

```
docker compose up --build
```

Then open http://localhost:3000. The first start fills the database with demo data.

To stop: `docker compose down` (add `-v` to also delete the database and uploaded files).

### Option 2: Node.js and a local MongoDB

You need Node.js 22 or newer and MongoDB running on `localhost:27017`.

```
npm install
npm start
```

Settings can be changed with environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the web server listens on |
| `MONGO_URL` | `mongodb://localhost:27017/student_portal` | Database connection string |
| `SESSION_SECRET` | built-in development value | Secret used to sign the session cookie |

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@portal.test | Admin123! |
| Lecturer | j.murphy@portal.test | Lecturer123! |
| Lecturer | a.kelly@portal.test | Lecturer123! |
| Student | s.byrne@portal.test | Student123! |
| Student | t.walsh@portal.test | Student123! |
| Student | n.doyle@portal.test | Student123! |
| Student | d.okafor@portal.test | Student123! |

`npm run seed` wipes the database and loads the demo data again.

### Functional tests

With the app running and the demo data loaded:

```
npm test
```

This runs `test/smoke.js`, which logs in as each role and checks that the main create, read,
update and delete flows work. It is also used for regression testing between versions.

## Project structure

```
src/
  app.js            Express setup, sessions, route registration, start-up
  seed.js           Demo data
  middleware/       Login and role checks
  models/           Mongoose models: User, Module, Announcement, Assignment, Submission
  routes/           One file per area: auth, dashboard, profile, modules, announcements,
                    assignments, submissions, grades, admin
  views/            EJS page templates
  public/           Stylesheet
uploads/            Uploaded assignment files (not committed)
test/smoke.js       Functional smoke test
docs/               AI usage record and v0 baseline notes
```

## Third-party software and licences

| Component | Version | Licence | Source |
| --- | --- | --- | --- |
| Node.js | 24 (Docker image `node:24-alpine`) | MIT | https://nodejs.org |
| MongoDB Community Server | 8 (Docker image `mongo:8`) | SSPL v1 | https://www.mongodb.com |
| express | 5.3.0 | MIT | https://www.npmjs.com/package/express |
| mongoose | 9.12.0 | MIT | https://www.npmjs.com/package/mongoose |
| ejs | 7.0.2 | Apache-2.0 | https://www.npmjs.com/package/ejs |
| express-session | 1.19.0 | MIT | https://www.npmjs.com/package/express-session |
| connect-mongo | 6.0.0 | MIT | https://www.npmjs.com/package/connect-mongo |
| bcryptjs | 3.0.3 | BSD-3-Clause | https://www.npmjs.com/package/bcryptjs |
| multer | 2.5.0 | MIT | https://www.npmjs.com/package/multer |

The application code was generated with AI assistance for this project (see
[docs/AI_USAGE.md](docs/AI_USAGE.md)). No code was reused from other projects.

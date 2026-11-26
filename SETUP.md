# Setup guide for the team

How to get the student portal running on your own computer. It takes about 15 minutes the first
time.

## 1. Install two things

- **Docker Desktop**: https://www.docker.com/products/docker-desktop
- **Git**: https://git-scm.com/downloads

Open Docker Desktop and wait until it says "Engine running" (bottom-left corner). It must be
running every time you start the portal.

## 2. Get the code

Open a terminal (PowerShell on Windows, Terminal on Mac) and run:

```
git clone https://github.com/mirei1le/CA3-Project.git
cd CA3-Project
git checkout v0
```

## 3. Start the portal

```
docker compose up --build
```

The first run takes a few minutes. It is ready when you see:

```
Student Portal running at http://localhost:3000
```

## 4. Open it

Go to http://localhost:3000 and log in with one of the demo accounts. Each role has a different
password, and they are case-sensitive.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@portal.test | Admin123! |
| Lecturer | j.murphy@portal.test | Lecturer123! |
| Student | s.byrne@portal.test | Student123! |

More demo accounts are listed in [README.md](README.md).

## Everyday commands

| I want to... | Do this |
| --- | --- |
| Stop the portal | Press `Ctrl+C` in the terminal |
| Start it again | `docker compose up --build` |
| Reset the data back to the demo data | `docker compose down -v` then `docker compose up --build` |
| Get the latest code from GitHub | `git pull` |

## Good to know

- **Your data is your own.** Everyone has a separate database on their own computer. Changes you
  make do not appear for anyone else.
- **Only run it locally.** v0 has no security hardening yet.
- **To look inside the database**, install MongoDB Compass and connect to
  `mongodb://localhost:27017` while the portal is running. The data is in `student_portal`.

## If something goes wrong

- **"error during connect ... dockerDesktopLinuxEngine"**: Docker Desktop is not running. Open it,
  wait for "Engine running", and try again.
- **"port is already allocated"**: something else is using port 3000 or 27017. Close it (or a
  previous copy of the portal) and try again.
- **Cannot log in**: paste the email and password from the table above, and check your browser
  has not autofilled a different password.

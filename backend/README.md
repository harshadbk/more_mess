# Sai Mess — Backend

A small Express + MongoDB API for the Sai Mess website (the React app in the parent folder).
It handles login (admin and user), optional groups, daily tiffin counts and payments.

## Run it

```bash
npm install      # first time only
npm run dev      # starts http://localhost:5000 and restarts when you save a file
```

Settings live in `.env` (copy `.env.example` to start). `index.js` loads it automatically.

**Admin account:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (plus `ADMIN_NAME`, `ADMIN_PHONE`) in `.env`.
The server creates that admin when it starts. To change the admin password, edit `ADMIN_PASSWORD` and restart.

## Files

```
index.js              loads .env, then starts src/index.js
src/index.js          the server: routes + error handling
src/db.js             connects to MongoDB
src/auth.js           login token, "logged in" / "admins only" checks, admin from .env
src/models/User.js    what a user looks like in the database
src/models/Group.js   a group of friends who eat together (optional)
src/models/Order.js   a change to someone's tiffins for one day (e.g. skip dinner)
src/models/Payment.js money paid by a person or group; needs both sides to agree
src/routes/auth.js    register, login, who am I, change my plan
src/routes/groups.js  create, join, add/remove members, leave, delete
src/routes/orders.js  my tiffins for a day, and changing them
src/routes/payments.js record, confirm or reject payments
src/routes/admin.js   users, groups, today's tiffin count, mark user active/left
```

## API

Everything is under `/api`. Logged-in requests send `Authorization: Bearer <token>`.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/auth/register` | anyone (always creates a normal user) |
| POST | `/auth/login` | anyone (`identifier` = email or phone) |
| GET | `/auth/me` | logged in |
| PATCH | `/auth/me` | logged in: change `plan` (daily/weekly/monthly), `meals` (lunch/dinner/both) etc. |
| GET | `/groups` | logged in: my groups |
| POST | `/groups` | logged in: create a group |
| POST | `/groups/join` | logged in: join with `inviteCode` |
| POST | `/groups/:id/members` | owner/admin: add by email or phone |
| DELETE | `/groups/:id/members/:userId` | owner/admin removes; a member can remove themselves |
| DELETE | `/groups/:id` | owner/admin |
| GET | `/orders?date=` | logged in: my tiffins for a day (default today) |
| PUT | `/orders` | logged in: `{ date, lunch, dinner }` for today or later |
| GET | `/payments` | admin: all; customer: own + their group's |
| POST | `/payments` | admin: `{ amount, userId or groupId }`; customer: `{ amount, forGroup? }` |
| POST | `/payments/:id/confirm` or `/reject` | the other side of the payment |
| GET | `/admin/orders?date=` | admin: tiffins needed per group and per individual |
| GET | `/admin/users`, `/admin/groups` | admin |
| PATCH | `/admin/users/:id` | admin: `{ active: false }` when someone leaves the mess |
| DELETE | `/admin/users/:id` | admin |

## How it works

- **Groups are optional.** Someone eating alone is an "individual". A person can be in only one group.
- **Tiffins:** everyone gets their plan's tiffins (`meals`) every day. An Order is saved only when
  someone changes a day (e.g. skips dinner). The admin's count = plan + those changes, for active users.
- **Payments:** whoever records a payment agrees to it automatically. It counts as *agreed* only
  after the other side confirms. Either side can reject while it is waiting.

## Problems

- **"Could not connect to any servers in your MongoDB Atlas cluster"** (with a `tlsv1 alert` error):
  your IP is not allowed. Atlas → Network Access → Add IP Address. If your internet IP keeps
  changing, use `0.0.0.0/0` (allow from anywhere) while developing.
- **`querySrv ECONNREFUSED`**: keep `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env`.
- **Port 5000 already in use**: another backend is still running; close that terminal.

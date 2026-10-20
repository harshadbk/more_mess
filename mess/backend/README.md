# Sai Mess — Backend

A small Express + MongoDB API for the Sai Mess website (the React app in the parent folder).
It handles login (admin and user), optional groups, the daily menu, tiffin records, billing and payments.

## Run it

```bash
npm install      # first time only
npm run dev      # starts http://localhost:5001 and restarts when you save a file
```

Settings live in `.env` (copy `.env.example` to start). `index.js` loads it automatically.

**Admin account:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (plus `ADMIN_NAME`, `ADMIN_PHONE`) in `.env`.
The admin is read from `.env` only and is never saved in the database. To change the admin password, edit `ADMIN_PASSWORD` and restart.

## Files

```
index.js              loads .env, then starts src/index.js
src/index.js          the server: routes + error handling
src/db.js             connects to MongoDB
src/tiffins.js        daily orders (carts), cut-offs, menu sync, bills, pending, heatmap data
src/auth.js           login token, "logged in" / "admins only" checks, admin from .env
src/models/User.js    what a user looks like in the database
src/models/Group.js   a group of friends who eat together (optional)
src/models/Order.js   one day's order (cart) for a person or a whole group: items + ₹ amount
src/models/Dish.js    a dish on the menu for a day: breakfast / lunch / dinner / special
src/models/Settings.js standard meal prices + order cut-off times
src/models/Payment.js money paid by a person or group; needs both sides to agree
src/routes/auth.js    register, login, who am I, change my plan
src/routes/groups.js  create, join, add/remove members, leave, delete
src/routes/orders.js  my tiffins for a day, changing them, my account, my history
src/routes/menu.js    the daily menu (public to read, admin to change)
src/routes/payments.js record, confirm or reject payments
src/routes/admin.js   users, groups, tiffin count for a day, heatmap, dues, prices
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
| GET | `/menu?date=` | anyone: dishes + meal prices for a day (default today) |
| POST / PUT / DELETE | `/menu`, `/menu/:id` | admin: add / edit / remove a dish (photo as a small data URL) |
| POST | `/menu/copy` | admin: `{ from, to }` copy a day's menu |
| GET | `/orders?date=` | logged in: my tiffins for a day (default today) |
| GET | `/orders?date=` | (returns the cart: menu options, prices, cut-offs, my or my group's order) |
| PUT | `/orders` | logged in: `{ date, items: [{ meal, dish, qty }] }`, today or later. In a group: owner only |
| GET | `/orders/account` | logged in: days taken, tiffins, charges, paid, pending (mine + my group's) |
| GET | `/orders/history?days=` | logged in: my tiffins per day (heatmap) |
| GET | `/payments` | admin: all; customer: own + their group's |
| POST | `/payments` | admin: `{ amount, userId or groupId }`; customer: `{ amount, forGroup? }` |
| POST | `/payments/:id/confirm` or `/reject` | the other side of the payment |
| GET | `/admin/orders?date=` | admin: tiffins + specials to make, per group and per individual |
| GET | `/admin/history?days=` | admin: tiffins per day for the whole mess (heatmap) |
| GET | `/admin/dues` | admin: charges, paid and pending for every group and individual |
| GET / PUT | `/admin/prices` | admin: `{ prices: { breakfast, lunch, dinner }, cutoffs: { breakfast: '07:00', … } }` |
| GET | `/admin/users`, `/admin/groups` | admin |
| PATCH | `/admin/users/:id` | admin: `{ active: false }` when someone leaves the mess |
| DELETE | `/admin/users/:id` | admin |

## How it works

- **Groups are optional.** Someone eating alone is an "individual". A person can be in only one group.
- **Orders are carts.** Each day every account gets ONE order: a person eating alone, or a whole
  group (1 tiffin per member who takes that meal; only the group's owner can change it). Items are
  menu options with a quantity; the bill is price × qty. Meals with no posted options aren't shown.
- **Cut-offs:** after a meal's cut-off time (admin sets it), today's order for that meal is locked.
- **Menu changes** (add/edit/remove a dish) update today's and later orders; past days never change.
- **Daily records:** every day (at startup and then hourly) each active customer gets an Order for
  today from their plan (`meals`). Customers can change today or later days: skip a meal or add
  specials. New sign-ups start the next day. Customers marked "left" get no new records.
- **Money:** each Order saves its ₹ amount when it is created/changed, so changing prices later
  never rewrites past bills. Pending = charges up to today − payments both sides agreed. A group's
  pending covers all its members and their own payments.
- **Payments:** whoever records a payment agrees to it automatically. It counts as *agreed* only
  after the other side confirms. Either side can reject while it is waiting.

## Problems

- **"Could not connect to any servers in your MongoDB Atlas cluster"** (with a `tlsv1 alert` error):
  your IP is not allowed. Atlas → Network Access → Add IP Address. If your internet IP keeps
  changing, use `0.0.0.0/0` (allow from anywhere) while developing.
- **`querySrv ECONNREFUSED`**: keep `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env`.
- **Port 5001 already in use**: another backend is still running; close that terminal.

# IronPulse Delivery Tracker

A MERN-stack application for managing fitness equipment deliveries and vehicles.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Testing:** Jest and Supertest
- **Authentication:** JWT, bcryptjs and HttpOnly cookies

## Project Structure

- `client/` — React frontend
- `server/` — Express backend
- `server/models/` — Mongoose data models
- `server/routes/` — REST API routes
- `server/middleware/` — Authentication and error-handling middleware
- `server/tests/` — Automated API tests

## Getting Started

### Backend

Open a terminal in `server/`:

```bash
npm install
npm run dev
```

Configure `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
```

Never commit real database credentials or JWT secrets.

### Frontend

Open another terminal in `client/`:

```bash
npm install
npm start
```

## Authentication and Authorization

Authentication uses bcryptjs password hashing and a signed JWT stored in an HttpOnly cookie named `ironpulse_token`. The cookie expires after one day.

- Public registration creates **driver** accounts only. A client-supplied `role` is ignored.
- Admin accounts must be created through a trusted administrative/seed process; never expose public admin registration.
- Login verifies the password and issues the JWT cookie.
- Logout clears the authentication cookie.
- Protected delivery endpoints return **401** when the cookie is missing, invalid or expired.
- Admins can view all deliveries and create, update or delete deliveries.
- Drivers can view only deliveries assigned to their user ID and can update only the status of their own assigned deliveries.

### Auth endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a driver and issue JWT cookie |
| POST | `/api/auth/login` | Verify credentials and issue JWT cookie |
| POST | `/api/auth/logout` | Clear the JWT cookie |
| GET | `/api/auth/test` | Check auth router |
| GET | `/api/auth/me` | Restore the current user from the JWT cookie |

Example registration body:

```json
{
  "name": "Test Driver",
  "email": "driver@example.com",
  "password": "DriverTest123!"
}
```

The password must contain at least 8 characters. The API never returns the JWT in JSON; it is set as an HttpOnly cookie.

## API Endpoints

### Vehicles — `/api/vehicles`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/vehicles` | List vehicles |
| GET | `/api/vehicles/:id` | Get a vehicle |
| POST | `/api/vehicles` | Create a vehicle |
| PUT | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

### Deliveries — `/api/deliveries`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/deliveries` | List all deliveries |
| GET | `/api/deliveries/:id` | Get a delivery by ID |
| POST | `/api/deliveries` | Create a delivery |
| PUT | `/api/deliveries/:id` | Admin update delivery details / legacy driver status update |
| PATCH | `/api/deliveries/:id` | Driver updates their assigned delivery status |
| DELETE | `/api/deliveries/:id` | Delete a delivery |

### Health Check

`GET http://localhost:5000/health`

## Create the First Admin Account

Public registration intentionally creates driver accounts only. To create the first admin, run the one-time seed script from the `server/` directory.

Add these values to your local `server/.env` file (do not commit this file):

```env
ADMIN_NAME=IronPulse Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-unique-password-at-least-12-characters-long
```

Run:

```bash
node scripts/seedAdmin.js
```

The script hashes the password with bcrypt and creates an admin account. It is safe to rerun: an existing admin is left unchanged, and an existing driver account is never promoted. Remove the three `ADMIN_*` values from `.env` after the account is created.

## Task 4 End-to-End Verification

1. Start the backend and frontend using the Getting Started instructions.
2. Sign in to Postman as the seeded admin with `POST http://localhost:5000/api/auth/login`. Keep the returned HttpOnly cookie in Postman.
3. In MongoDB Atlas, open the `users` collection and copy the `_id` of the driver account you want to assign. Do not use the admin's ID.
4. While still authenticated as admin, send `POST http://localhost:5000/api/deliveries` with this JSON body, replacing the driver ID and sample details:

```json
{
  "trackingNumber": "IP-TEST-1001",
  "customerName": "Test Customer",
  "deliveryAddress": "Main Boulevard, Lahore",
  "status": "Pending",
  "driverName": "Test Driver",
  "driverId": "REPLACE_WITH_DRIVER_OBJECT_ID"
}
```

Expect **201 Created**. Use a new tracking number if you repeat the test.
5. Sign in to the React app using that same driver account. The assigned delivery should appear on the dashboard.
6. Click **Mark Picked**, then **Mark In Transit**, then **Mark Delivered**. Confirm each status changes in the table without a page reload.
7. Refresh the page and confirm the final status remains **Delivered**. Also confirm an unassigned driver cannot see this delivery.

## Manual API Verification (Postman)

1. Register a driver with `POST http://localhost:5000/api/auth/register`.
2. Confirm status **201** and a `Set-Cookie` response header containing `ironpulse_token` and `HttpOnly`.
3. Login with the same credentials at `POST http://localhost:5000/api/auth/login`; expect **200**.
4. Send `GET http://localhost:5000/api/deliveries` without a cookie; expect **401**.
5. Send the same request with the login cookie; a driver receives only their assigned deliveries.
6. Test admin access with an admin account created securely in the database; admin receives all deliveries.

Postman normally stores response cookies automatically. Do not share JWT cookies or real credentials.

## Driver Dashboard (Task 4 progress)

The React client uses Axios with `withCredentials` so the browser sends the backend's HttpOnly `ironpulse_token` cookie. AuthContext restores the current session through `GET /api/auth/me`; React Router protects the dashboard. The driver dashboard loads the signed-in driver's assigned deliveries and updates status through `PATCH /api/deliveries/:id` without reloading the page.

Allowed driver status updates are `Picked Up`, `In Transit`, and `Delivered`. The UI displays `Picked Up` as `Picked`. Configure `CLIENT_URL` in the server environment when the React app runs on a different origin.

## Automated Tests

Run from `server/`:

```bash
npm test
```

The Jest/Supertest suite covers:

- Driver registration, bcrypt password hashing and HttpOnly JWT cookie issuance
- Prevention of public admin registration
- Successful login and rejection of incorrect credentials
- Rejection of missing and invalid JWT cookies on protected routes
- Admin access to all deliveries
- Driver access limited to their own assigned deliveries
- Rejection of delivery creation by drivers
- Successful delivery creation by admins
- `GET /api/vehicles` response

### Frontend dashboard tests

Run from `client/`:

```bash
npm test -- --watchAll=false
```

The dashboard component tests cover loading, delivery rendering, status updates, API errors and the empty state.

## Lint

```bash
npm run lint

## Task 5 — Live Vehicle Map and Route History

The manager fleet workspace is available at `/manager/fleet` after signing in with an admin account.

- **Live map:** Leaflet/OpenStreetMap markers for vehicles with saved GPS coordinates. Marker popups show vehicle ID and last update time. The client refreshes locations every 15 seconds.
- **Route history:** Delivery table with inclusive start/end date filters and pagination (10 records per page).

### Task 5 API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/vehicles/locations` | Admin | Current GPS positions: `{ vehicleId, lat, lng, updatedAt }` |
| GET | `/api/deliveries/history?page=1&limit=10&startDate=2026-11-01&endDate=2026-11-30` | Admin | Filtered history and pagination metadata |

The history response is `{ data, total, page, limit, totalPages }`. Dates are optional; page defaults to 1 and limit defaults to 10 (maximum 100). MongoDB aggregation with `$facet` returns the selected page and total count together.

### Seed simulated vehicle locations

Run from `server/` after configuring `.env` and ensuring at least one vehicle exists:

```bash
node scripts/seedVehicleLocations.js
```

Optional `GPS_CENTER_LAT` and `GPS_CENTER_LNG` environment variables change the centre for generated coordinates. The script updates stored coordinates and `lastSeen`; it does not continuously move vehicles.

### Frontend dependencies

The client uses Leaflet, React Leaflet, date-fns and React Paginate. Run `npm install` in `client/` after pulling these changes.

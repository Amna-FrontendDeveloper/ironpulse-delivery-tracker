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

## Lint

```bash
npm run lint
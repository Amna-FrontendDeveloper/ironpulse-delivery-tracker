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

### Deliveries — `/api/deliveries` (authentication required)

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/deliveries` | Admin: all; Driver: assigned only |
| GET | `/api/deliveries/:id` | Admin: any; Driver: own assignment only |
| POST | `/api/deliveries` | Admin only |
| PUT | `/api/deliveries/:id` | Admin; Driver: status only on own assignment |
| DELETE | `/api/deliveries/:id` | Admin only |

### Vehicles — `/api/vehicles`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/vehicles` | List vehicles |
| GET | `/api/vehicles/:id` | Get a vehicle |
| POST | `/api/vehicles` | Create a vehicle |
| PUT | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

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

## Automated Tests

Run from `server/`:

```bash
npm test
```

The API test suite covers driver registration and password hashing, the registration JWT cookie, role protection against public admin registration, invalid login, missing/invalid JWTs, admin/driver delivery visibility and driver restrictions.

## Lint

```bash
npm run lint
```

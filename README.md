# IronPulse Delivery Tracker

A MERN-stack application for managing fitness equipment deliveries and vehicles.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Testing:** Jest and Supertest
- **Authentication:** JWT and bcryptjs

## Project Structure

- `client/` — React frontend
- `server/` — Express backend
- `server/models/` — Mongoose data models
- `server/routes/` — REST API routes
- `server/middleware/` — Error-handling middleware
- `server/tests/` — Automated API tests

## Getting Started

### 1. Frontend

```bash
cd client
npm install
npm start
```

### 2. Backend

Open a terminal in the `server/` directory:

```bash
npm install
npm start
```

Configure the required environment variables in `server/.env` before starting the backend.

Example `server/.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Never commit real database credentials or JWT secrets.

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create a driver account (bcrypt-hashed password) and set the JWT cookie |
| POST | `/api/auth/login` | Check credentials and set the JWT cookie |
| POST | `/api/auth/logout` | Clear the JWT cookie |

The JWT is stored in an **HttpOnly** cookie named `ironpulse_token` (1 day expiry, `Secure` in production).
Registration always creates a `driver`; admin accounts are created directly in the database.

### Vehicles — `/api/vehicles`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/vehicles` | List all vehicles |
| GET | `/api/vehicles/:id` | Get a vehicle by ID |
| POST | `/api/vehicles` | Create a vehicle |
| PUT | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

### Deliveries — `/api/deliveries` (login required)

Requests without a valid cookie get `401`. Access depends on the role:

- **Admin:** sees and manages all deliveries.
- **Driver:** sees only deliveries where `driverId` matches their user ID, and can only update the `status` of those.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/deliveries` | List all deliveries |
| GET | `/api/deliveries/:id` | Get a delivery by ID |
| POST | `/api/deliveries` | Create a delivery |
| PUT | `/api/deliveries/:id` | Update a delivery |
| DELETE | `/api/deliveries/:id` | Delete a delivery |

### Health Check

`GET http://localhost:5000/health`

Returns the backend health status.

## Automated Tests

Run tests from the `server/` directory:

```bash
npm test
```

The tests connect to the database in `MONGODB_URI` and delete the test data they create. The Jest/Supertest suite checks:

- Registration (hashed password, JWT cookie, duplicate email, short password, role cannot be self-assigned)
- Login (valid, wrong password, unknown email)
- Protected routes (401 without or with a bad token, driver sees only own deliveries, admin sees all, driver cannot create)
- `GET /api/vehicles` and admin `POST /api/deliveries`

## Lint

Run the backend lint script from the `server/` directory:

```bash
npm run lint
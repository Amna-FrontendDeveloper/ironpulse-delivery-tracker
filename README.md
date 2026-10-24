
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

### Vehicles — `/api/vehicles`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/vehicles` | List all vehicles |
| GET | `/api/vehicles/:id` | Get a vehicle by ID |
| POST | `/api/vehicles` | Create a vehicle |
| PUT | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

### Deliveries — `/api/deliveries`

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

The Jest/Supertest suite currently checks:

- `GET /api/vehicles`
- `POST /api/deliveries`

## Lint

Run the backend lint script from the `server/` directory:

```bash
npm run lint
```

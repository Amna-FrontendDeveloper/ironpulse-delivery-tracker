require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Delivery = require("../models/Delivery");
const User = require("../models/User");

jest.setTimeout(30000);

let adminEmail;
let adminPassword;
let adminId;
let driverEmail;
let driverPassword;
let driverId;
let driverCookie;
let adminCookie;
let ownTracking;
let otherTracking;

const cookiePair = (response) => {
  const cookies = response.headers["set-cookie"] || [];
  const authCookie = cookies.find((cookie) =>
    cookie.startsWith("ironpulse_token=")
  );
  return authCookie ? authCookie.split(";")[0] : null;
};

beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from server/.env");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from server/.env");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  adminEmail = `test-admin-${suffix}@ironpulse.test`;
  driverEmail = `test-driver-${suffix}@ironpulse.test`;
  adminPassword = `AdminPassword-${suffix}!`;
  driverPassword = `DriverPassword-${suffix}!`;

  const [adminHash, driverHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(driverPassword, 12),
  ]);

  const [admin, driver] = await User.create([
    {
      name: "IronPulse Test Admin",
      email: adminEmail,
      password: adminHash,
      role: "admin",
    },
    {
      name: "IronPulse Test Driver",
      email: driverEmail,
      password: driverHash,
      role: "driver",
    },
  ]);

  adminId = admin._id;
  driverId = driver._id;

  const [adminLogin, driverLogin] = await Promise.all([
    request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    }),
    request(app).post("/api/auth/login").send({
      email: driverEmail,
      password: driverPassword,
    }),
  ]);

  if (adminLogin.statusCode !== 200 || driverLogin.statusCode !== 200) {
    throw new Error("Unable to create test authentication sessions");
  }
  adminCookie = cookiePair(adminLogin);
  driverCookie = cookiePair(driverLogin);

  ownTracking = `TEST-OWN-${suffix}`;
  otherTracking = `TEST-OTHER-${suffix}`;
  await Delivery.create([
    {
      trackingNumber: ownTracking,
      customerName: "Assigned Test Customer",
      deliveryAddress: "Assigned Test Address",
      driverId,
    },
    {
      trackingNumber: otherTracking,
      customerName: "Unassigned Test Customer",
      deliveryAddress: "Other Test Address",
    },
  ]);
});

afterAll(async () => {
  try {
    if (adminEmail || driverEmail) {
      await User.deleteMany({
        email: { $in: [adminEmail, driverEmail].filter(Boolean) },
      });
    }
    await Delivery.deleteMany({
      trackingNumber: { $in: [ownTracking, otherTracking].filter(Boolean) },
    });
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
});

describe("IronPulse authentication and role-based access", () => {
  test("POST /api/auth/register hashes password and returns an HttpOnly JWT cookie", async () => {
    const email = `register-${Date.now()}@ironpulse.test`;
    const password = "RegisterTest123!";

    try {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ name: "New Test Driver", email, password });

      expect(response.statusCode).toBe(201);
      expect(response.body.user.role).toBe("driver");
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"].join(";")).toMatch(/ironpulse_token=/);
      expect(response.headers["set-cookie"].join(";")).toMatch(/HttpOnly/i);

      const savedUser = await User.findOne({ email });
      expect(savedUser).not.toBeNull();
      expect(savedUser.password).not.toBe(password);
      expect(await bcrypt.compare(password, savedUser.password)).toBe(true);
    } finally {
      await User.deleteOne({ email });
    }
  });

  test("public registration never grants admin role", async () => {
    const email = `no-admin-${Date.now()}@ironpulse.test`;
    try {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Role Test",
          email,
          password: "RoleTest123!",
          role: "admin",
        });
      expect(response.statusCode).toBe(201);
      expect(response.body.user.role).toBe("driver");
    } finally {
      await User.deleteOne({ email });
    }
  });

  test("POST /api/auth/login rejects incorrect credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: "WrongPassword123!" });
    expect(response.statusCode).toBe(401);
  });

  test("protected delivery route rejects missing authentication", async () => {
    const response = await request(app).get("/api/deliveries");
    expect(response.statusCode).toBe(401);
  });

  test("protected delivery route rejects an invalid JWT", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", "ironpulse_token=not-a-valid-jwt");
    expect(response.statusCode).toBe(401);
  });

  test("admin can see all deliveries", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", adminCookie);
    expect(response.statusCode).toBe(200);
    expect(response.body.some((item) => item.trackingNumber === ownTracking)).toBe(true);
    expect(response.body.some((item) => item.trackingNumber === otherTracking)).toBe(true);
  });

  test("driver can see only deliveries assigned to that driver", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", driverCookie);
    expect(response.statusCode).toBe(200);
    expect(response.body.some((item) => item.trackingNumber === ownTracking)).toBe(true);
    expect(response.body.some((item) => item.trackingNumber === otherTracking)).toBe(false);
  });

  test("driver cannot create a delivery", async () => {
    const response = await request(app)
      .post("/api/deliveries")
      .set("Cookie", driverCookie)
      .send({
        trackingNumber: `DRIVER-BLOCKED-${Date.now()}`,
        customerName: "Blocked Customer",
        deliveryAddress: "Blocked Address",
      });
    expect(response.statusCode).toBe(403);
  });

  test("GET /api/vehicles returns a list", async () => {
    const response = await request(app).get("/api/vehicles");
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

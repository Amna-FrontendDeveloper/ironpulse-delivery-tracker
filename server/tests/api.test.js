require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const app = require("../app");

const User = require("../models/User");
const Delivery = require("../models/Delivery");

jest.setTimeout(30000);

const testRunId = Date.now();
const testTrackingPrefix = `TASK3-${testRunId}`;

let admin;
let driverOne;
let driverTwo;
let adminPassword;
let driverOnePassword;
let adminCookie;
let driverOneCookie;

async function loginAndGetCookie(email, password) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  expect(response.statusCode).toBe(200);

  const cookies = response.headers["set-cookie"] || [];
  const authCookie = cookies.find((cookie) =>
    cookie.startsWith("ironpulse_token=")
  );

  expect(authCookie).toBeDefined();
  return authCookie.split(";")[0];
}

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

  const passwordHash = await bcrypt.hash(`Task3Password-${testRunId}!`, 12);
  adminPassword = `Task3Password-${testRunId}!`;
  driverOnePassword = `DriverPassword-${testRunId}!`;

  admin = await User.create({
    name: "Task 3 Test Admin",
    email: `task3-admin-${testRunId}@ironpulse.test`,
    password: passwordHash,
    role: "admin",
  });

  driverOne = await User.create({
    name: "Task 3 Driver One",
    email: `task3-driver-one-${testRunId}@ironpulse.test`,
    password: await bcrypt.hash(driverOnePassword, 12),
    role: "driver",
  });

  driverTwo = await User.create({
    name: "Task 3 Driver Two",
    email: `task3-driver-two-${testRunId}@ironpulse.test`,
    password: await bcrypt.hash(`OtherDriver-${testRunId}!`, 12),
    role: "driver",
  });

  adminCookie = await loginAndGetCookie(admin.email, adminPassword);
  driverOneCookie = await loginAndGetCookie(
    driverOne.email,
    driverOnePassword
  );

  await Delivery.create([
    {
      trackingNumber: `${testTrackingPrefix}-DRIVER-ONE`,
      customerName: "Assigned Customer",
      deliveryAddress: "Driver One Test Address",
      driverId: driverOne._id,
    },
    {
      trackingNumber: `${testTrackingPrefix}-DRIVER-TWO`,
      customerName: "Other Customer",
      deliveryAddress: "Driver Two Test Address",
      driverId: driverTwo._id,
    },
  ]);
});

afterAll(async () => {
  try {
    await Delivery.deleteMany({
      trackingNumber: { $regex: `^${testTrackingPrefix}` },
    });

    await User.deleteMany({
      email: {
        $in: [
          `task3-admin-${testRunId}@ironpulse.test`,
          `task3-driver-one-${testRunId}@ironpulse.test`,
          `task3-driver-two-${testRunId}@ironpulse.test`,
          `task3-register-${testRunId}@ironpulse.test`,
        ],
      },
    });
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
});

describe("IronPulse Task 3 - Authentication and Role-Based Access", () => {
  test("POST /api/auth/register hashes the password and sets an HttpOnly JWT cookie", async () => {
    const email = `task3-register-${testRunId}@ironpulse.test`;
    const password = `RegisterPassword-${testRunId}!`;

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "New Test Driver",
        email,
        password,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.role).toBe("driver");
    expect(response.body.user.password).toBeUndefined();

    const savedUser = await User.findOne({ email });
    expect(savedUser).toBeTruthy();
    expect(savedUser.password).not.toBe(password);
    expect(await bcrypt.compare(password, savedUser.password)).toBe(true);

    const setCookie = response.headers["set-cookie"] || [];
    const authCookie = setCookie.find((cookie) =>
      cookie.startsWith("ironpulse_token=")
    );

    expect(authCookie).toBeDefined();
    expect(authCookie.toLowerCase()).toContain("httponly");
  });

  test("Public registration cannot create an admin account", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Attempted Admin",
        email: `task3-public-admin-${testRunId}@ironpulse.test`,
        password: `SecurePassword-${testRunId}!`,
        role: "admin",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.role).toBe("driver");

    await User.deleteOne({
      email: `task3-public-admin-${testRunId}@ironpulse.test`,
    });
  });

  test("POST /api/auth/login returns an authentication cookie for valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: driverOne.email,
        password: driverOnePassword,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.role).toBe("driver");

    const setCookie = response.headers["set-cookie"] || [];
    expect(
      setCookie.some((cookie) => cookie.startsWith("ironpulse_token="))
    ).toBe(true);
  });

  test("Login rejects an incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: admin.email,
        password: "Incorrect-Password!",
      });

    expect(response.statusCode).toBe(401);
  });

  test("Protected delivery route rejects a missing JWT cookie", async () => {
    const response = await request(app).get("/api/deliveries");
    expect(response.statusCode).toBe(401);
  });

  test("Protected delivery route rejects an invalid JWT cookie", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", "ironpulse_token=invalid.token.value");

    expect(response.statusCode).toBe(401);
  });

  test("Admin can view all deliveries", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", adminCookie);

    expect(response.statusCode).toBe(200);

    const trackingNumbers = response.body.map(
      (delivery) => delivery.trackingNumber
    );

    expect(trackingNumbers).toContain(
      `${testTrackingPrefix}-DRIVER-ONE`
    );
    expect(trackingNumbers).toContain(
      `${testTrackingPrefix}-DRIVER-TWO`
    );
  });

  test("Driver can view only deliveries assigned to their account", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", driverOneCookie);

    expect(response.statusCode).toBe(200);

    const trackingNumbers = response.body.map(
      (delivery) => delivery.trackingNumber
    );

    expect(trackingNumbers).toContain(
      `${testTrackingPrefix}-DRIVER-ONE`
    );
    expect(trackingNumbers).not.toContain(
      `${testTrackingPrefix}-DRIVER-TWO`
    );
  });

  test("Driver cannot create a delivery", async () => {
    const response = await request(app)
      .post("/api/deliveries")
      .set("Cookie", driverOneCookie)
      .send({
        trackingNumber: `${testTrackingPrefix}-DRIVER-CREATE-ATTEMPT`,
        customerName: "Unauthorized Customer",
        deliveryAddress: "Unauthorized Address",
      });

    expect(response.statusCode).toBe(403);

    await Delivery.deleteOne({
      trackingNumber: `${testTrackingPrefix}-DRIVER-CREATE-ATTEMPT`,
    });
  });

  test("Admin can create a delivery", async () => {
    const trackingNumber = `${testTrackingPrefix}-ADMIN-CREATE`;

    try {
      const response = await request(app)
        .post("/api/deliveries")
        .set("Cookie", adminCookie)
        .send({
          trackingNumber,
          customerName: "Admin Test Customer",
          deliveryAddress: "Admin Test Address",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.trackingNumber).toBe(trackingNumber);
      expect(response.body.customerName).toBe("Admin Test Customer");
    } finally {
      await Delivery.deleteOne({ trackingNumber });
    }
  });

  test("Driver can PATCH the status of their own assigned delivery", async () => {
    const trackingNumber = `${testTrackingPrefix}-PATCH-STATUS`;
    const delivery = await Delivery.create({
      trackingNumber,
      customerName: "Status Update Customer",
      deliveryAddress: "Status Update Test Address",
      driverId: driverOne._id,
      status: "Pending",
    });

    try {
      const response = await request(app)
        .patch(`/api/deliveries/${delivery._id}`)
        .set("Cookie", driverOneCookie)
        .send({ status: "Picked Up" });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("Picked Up");

      const savedDelivery = await Delivery.findById(delivery._id);
      expect(savedDelivery.status).toBe("Picked Up");
    } finally {
      await Delivery.deleteOne({ _id: delivery._id });
    }
  });

  test("GET /api/vehicles returns a list", async () => {
    const response = await request(app).get("/api/vehicles");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

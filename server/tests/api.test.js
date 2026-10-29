
require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Delivery = require("../models/Delivery");
const User = require("../models/User");

jest.setTimeout(20000);

let adminEmail;
let adminPassword;

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

  adminEmail = `test-admin-${Date.now()}@ironpulse.test`;
  adminPassword = `TestPassword-${Date.now()}!`;

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await User.create({
    name: "IronPulse Test Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
  });
});

afterAll(async () => {
  try {
    if (adminEmail) {
      await User.deleteOne({ email: adminEmail });
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
});

describe("IronPulse API", () => {
  test("GET /api/vehicles returns a list", async () => {
    const response = await request(app).get("/api/vehicles");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /api/deliveries creates a delivery for an admin", async () => {
    const trackingNumber = `TEST-${Date.now()}`;

    try {
      // Login and obtain the authentication cookie.
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: adminEmail,
          password: adminPassword,
        });

      expect(loginResponse.statusCode).toBe(200);

      const setCookie = loginResponse.headers["set-cookie"] || [];

      const authCookie = setCookie.find((cookie) =>
        cookie.startsWith("ironpulse_token=")
      );

      console.log("AUTH COOKIE FOUND:", Boolean(authCookie));

      expect(authCookie).toBeDefined();

      // Send only the cookie name and value, without cookie attributes.
      const cookiePair = authCookie.split(";")[0];

      const response = await request(app)
        .post("/api/deliveries")
        .set("Cookie", cookiePair)
        .send({
          trackingNumber,
          customerName: "Test Customer",
          deliveryAddress: "Test Address",
        });

      console.log("DELIVERY STATUS:", response.statusCode);
      console.log("DELIVERY BODY:", response.body);

      expect(response.statusCode).toBe(201);
      expect(response.body.trackingNumber).toBe(trackingNumber);
      expect(response.body.customerName).toBe("Test Customer");
    } finally {
      await Delivery.deleteOne({ trackingNumber });
    }
  });
});

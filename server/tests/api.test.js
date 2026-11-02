require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../app");

const User = require("../models/User");
const Delivery = require("../models/Delivery");

describe("IronPulse Delivery API", () => {
  let admin;
  let adminCookie;
  let deliveryId;

  const testEmail = `admin-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

    admin = await User.create({
      name: "Test Admin",
      email: testEmail,
      password: hashedPassword,
      role: "admin",
    });

    // Generate a test token and send it as the auth cookie.
    const token = jwt.sign(
      {
        userId: admin._id.toString(),
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    adminCookie = `ironpulse_token=${token}`;
  });

  afterAll(async () => {
    if (deliveryId) {
      await Delivery.findByIdAndDelete(deliveryId);
    }

    if (admin?._id) {
      await User.findByIdAndDelete(admin._id);
    }

    await mongoose.disconnect();
  });

  test("GET /api/vehicles returns a list", async () => {
    const response = await request(app)
      .get("/api/vehicles")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /api/deliveries creates a delivery", async () => {
    const response = await request(app)
      .post("/api/deliveries")
      .set("Cookie", adminCookie)
      .send({
        trackingNumber: `IP-TEST-${Date.now()}`,
        customerName: "Test Customer",
        deliveryAddress: "Test Street, Lahore",
        status: "Pending",
      });

    expect(response.status).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.customerName).toBe("Test Customer");

    deliveryId = response.body._id;
  });

  test("GET /api/deliveries returns deliveries", async () => {
    const response = await request(app)
      .get("/api/deliveries")
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(
      response.body.some((delivery) => delivery._id === deliveryId)
    ).toBe(true);
  });

  test("GET /api/deliveries/:id returns one delivery", async () => {
    const response = await request(app)
      .get(`/api/deliveries/${deliveryId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(deliveryId);
  });

  test("PUT /api/deliveries/:id updates a delivery", async () => {
    const response = await request(app)
      .put(`/api/deliveries/${deliveryId}`)
      .set("Cookie", adminCookie)
      .send({ status: "In Transit" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("In Transit");
  });

  test("DELETE /api/deliveries/:id deletes a delivery", async () => {
    const response = await request(app)
      .delete(`/api/deliveries/${deliveryId}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Delivery deleted successfully");

    deliveryId = null;
  });

  test("Unauthenticated users cannot access deliveries", async () => {
    const response = await request(app).get("/api/deliveries");

    expect(response.status).toBe(401);
  });
});

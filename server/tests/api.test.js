
require("dotenv").config();

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const Delivery = require("../models/Delivery");

beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from server/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("IronPulse API", () => {
  test("GET /api/vehicles returns a list", async () => {
    const response = await request(app).get("/api/vehicles");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /api/deliveries creates a delivery", async () => {
    const trackingNumber = `TEST-${Date.now()}`;

    try {
      const response = await request(app)
        .post("/api/deliveries")
        .send({
          trackingNumber,
          customerName: "Test Customer",
          deliveryAddress: "Test Address",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.trackingNumber).toBe(trackingNumber);
      expect(response.body.customerName).toBe("Test Customer");
    } finally {
      await Delivery.deleteOne({ trackingNumber });
    }
  });
});

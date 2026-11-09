require("dotenv").config();

const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");

// Generate demo GPS points in a small area around the configured city center.
// Defaults to Rawalpindi/Islamabad; override with GPS_CENTER_LAT/GPS_CENTER_LNG.
const CENTER_LAT = Number(process.env.GPS_CENTER_LAT || 33.6844);
const CENTER_LNG = Number(process.env.GPS_CENTER_LNG || 73.0479);
const LATITUDE_SPREAD = 0.04;
const LONGITUDE_SPREAD = 0.05;

function randomCoordinate(center, spread) {
  return Number((center + (Math.random() - 0.5) * 2 * spread).toFixed(6));
}

async function seedVehicleLocations() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the server/.env file");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const vehicles = await Vehicle.find().select("_id").lean();

    if (vehicles.length === 0) {
      console.log("No vehicles found. Create vehicles first, then run this script again.");
      return;
    }

    const lastSeen = new Date();
    const operations = vehicles.map((vehicle) => ({
      updateOne: {
        filter: { _id: vehicle._id },
        update: {
          $set: {
            latitude: randomCoordinate(CENTER_LAT, LATITUDE_SPREAD),
            longitude: randomCoordinate(CENTER_LNG, LONGITUDE_SPREAD),
            lastSeen,
          },
        },
      },
    }));

    const result = await Vehicle.bulkWrite(operations);
    console.log(`Updated GPS locations for ${result.modifiedCount} of ${vehicles.length} vehicles.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedVehicleLocations().catch(async (error) => {
  console.error("Unable to generate vehicle locations:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});

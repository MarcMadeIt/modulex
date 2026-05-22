import "dotenv/config";
import mongoose from "mongoose";
import argon2 from "argon2";
import { User } from "./models/User";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const password = await argon2.hash("Secret123!");

  await User.findOneAndUpdate(
    { email: "admin@example.com" },
    {
      email: "admin@example.com",
      phone: "+00 00 00 00 00",
      password,
      role: "admin",
      status: "active",
    },
    { upsert: true, new: true },
  );

  console.log("Seeded: admin@example.com / Secret123!");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

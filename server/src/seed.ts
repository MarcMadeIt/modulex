import "dotenv/config";
import mongoose from "mongoose";
import argon2 from "argon2";
import { User } from "./models/User";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const password = await argon2.hash("test1234!");

  await User.findOneAndUpdate(
    { email: "admin@test.dk" },
    {
      email: "admin@test.dk",
      companyName: "Admin",
      contactPerson: "Admin",
      phone: "+00 00 00 00 00",
      password,
      role: "admin",
      status: "active",
    },
    { upsert: true, returnDocument: "after" },
  );

  console.log("Seeded: admin@test.dk / test1234!");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

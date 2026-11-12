const bcrypt = require("bcrypt");
const User = require("./models/User");
const connectDB = require("./config/db");

async function createAppController() {
  try {
    await connectDB();

    const email = "controller@smartcampus.com";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("================================");
      console.log("AppController already exists.");
      console.log("Email:", existingUser.email);
      console.log("Role:", existingUser.role);
      console.log("================================");

      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      "Controller@123",
      10
    );

    const user = await User.create({
      name: "App Controller",
      email: email,
      password: hashedPassword,
      studentId: "",
      userType: "Staff",
      role: "AppController",
      department: "Administration",
      isActive: true,
    });

    console.log("================================");
    console.log("AppController created successfully");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("================================");

    process.exit(0);
  } catch (error) {
    console.error("Error creating AppController:");
    console.error(error);
    process.exit(1);
  }
}

createAppController();
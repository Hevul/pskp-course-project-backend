import mongoose from "mongoose";

async function connect(connectionString: string) {
  try {
    await mongoose.connect(connectionString);
    console.log("Database is connected");
  } catch (error) {
    console.error("Database connection error: ", error);
  }
}

export default connect;

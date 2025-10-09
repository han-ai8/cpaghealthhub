import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB Cluster = Database is connected successfully');
    });
    await mongoose.connect(`${process.env.MONGODB_URL}/HealthHub`);
  } catch (error) {
    console.error(error.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
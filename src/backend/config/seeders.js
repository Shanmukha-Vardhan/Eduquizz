const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Corrected path

require('dotenv').config(); // In case you use .env for DB_URI

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduquizz';

// --- Connect to Database ---
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for seeding/destroy...');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  }
};

const defaultUsers = [
  {
    name: 'Admin',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin',
  },
  {
    name: 'Teacher',
    email: 'teacher@example.com',
    password: '123456',
    role: 'teacher',
  },
  {
    name: 'Student',
    email: 'student@example.com',
    password: '123456',
    role: 'student',
  },
];

const importData = async () => {
  try {
    // Add import logic here (currently only users are seeded)
    console.log('Starting data import...');

    for (let user of defaultUsers) {
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        const hashed = await bcrypt.hash(user.password, 10);
        await User.create({ ...user, password: hashed });
        console.log(`✅ Created ${user.role}: ${user.email}`);
      } else {
        console.log(`⏩ Skipped (already exists): ${user.email}`);
      }
    }
    console.log('✅ User seeding complete.');

    // Add logic for seeding other models (Quizzes, Questions, etc.) here if needed
    // ...

  } catch (error) {
    console.error('❌ Error during data import:', error);
    process.exit(1); // Exit on error
  }
};

const destroyData = async () => {
  try {
    console.log('Starting data destroy...');

    // Delete users
    await User.deleteMany();
    console.log('✅ Users destroyed.');

    // Add logic for destroying other models (Quizzes, Questions, etc.) here if needed
    // await Quiz.deleteMany();
    // console.log('✅ Quizzes destroyed.');
    // ...

    console.log('✅ Data destroy complete.');

  } catch (error) {
    console.error('❌ Error during data destroy:', error);
    process.exit(1); // Exit on error
  }
};

// --- Main execution logic ---
const runSeeder = async () => {
    await connectDB(); // Connect before any operations

    // Check for the command line argument
    if (process.argv[2] === '-d') {
        await destroyData();
    } else {
        await importData();
    }

    // Disconnect after operations are done
    mongoose.disconnect();
    console.log('✅ MongoDB disconnected.');
};

runSeeder(); // Start the process
// Fills the database with demo (synthetic) data.
// Runs automatically the first time the app starts with an empty database,
// or manually with:  npm run seed   (this wipes the existing data first)

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Module = require('./models/Module');
const Announcement = require('./models/Announcement');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');

const uploadDir = path.join(__dirname, '..', 'uploads');

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function seedDatabase() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const lecturerPassword = await bcrypt.hash('Lecturer123!', 10);
  const studentPassword = await bcrypt.hash('Student123!', 10);

  // ----- Users -----
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@portal.test',
    password: adminPassword,
    role: 'admin',
    phone: '085 000 0001',
  });

  const [murphy, kelly] = await User.create([
    {
      name: 'Dr. Joan Murphy',
      email: 'j.murphy@portal.test',
      password: lecturerPassword,
      role: 'lecturer',
      phone: '085 000 0010',
    },
    {
      name: 'Dr. Aidan Kelly',
      email: 'a.kelly@portal.test',
      password: lecturerPassword,
      role: 'lecturer',
      phone: '085 000 0011',
    },
  ]);

  const [sarah, tom, niamh, david] = await User.create([
    {
      name: 'Sarah Byrne',
      email: 's.byrne@portal.test',
      password: studentPassword,
      role: 'student',
      studentNumber: 'S1000001',
      phone: '085 000 0101',
      address: '1 Example Street, Dublin 15',
      dateOfBirth: '2004-03-12',
    },
    {
      name: 'Tom Walsh',
      email: 't.walsh@portal.test',
      password: studentPassword,
      role: 'student',
      studentNumber: 'S1000002',
      phone: '085 000 0102',
      address: '22 Sample Road, Dublin 7',
      dateOfBirth: '2003-11-02',
    },
    {
      name: 'Niamh Doyle',
      email: 'n.doyle@portal.test',
      password: studentPassword,
      role: 'student',
      studentNumber: 'S1000003',
      phone: '085 000 0103',
      address: '8 Demo Avenue, Dublin 11',
      dateOfBirth: '2004-07-25',
    },
    {
      name: 'David Okafor',
      email: 'd.okafor@portal.test',
      password: studentPassword,
      role: 'student',
      studentNumber: 'S1000004',
      phone: '085 000 0104',
      address: '14 Test Lane, Dublin 24',
      dateOfBirth: '2003-01-30',
    },
  ]);

  // ----- Modules -----
  const [webdev, databases, networks] = await Module.create([
    {
      code: 'COMP101',
      title: 'Web Development',
      description: 'Building websites with HTML, CSS, JavaScript and Node.js.',
      lecturer: murphy._id,
      students: [sarah._id, tom._id, niamh._id],
    },
    {
      code: 'COMP202',
      title: 'Database Systems',
      description: 'Data modelling, relational and document databases.',
      lecturer: murphy._id,
      students: [sarah._id, david._id],
    },
    {
      code: 'NETW150',
      title: 'Computer Networks',
      description: 'How networks and the internet work, from cables to protocols.',
      lecturer: kelly._id,
      students: [tom._id, niamh._id, david._id],
    },
  ]);

  // ----- Announcements -----
  await Announcement.create([
    {
      module: webdev._id,
      author: murphy._id,
      title: 'Welcome to Web Development',
      body: 'Lectures are on Mondays at 10:00. Labs start in week 2.',
      createdAt: daysFromNow(-10),
    },
    {
      module: webdev._id,
      author: murphy._id,
      title: 'Assignment 1 is now available',
      body: 'Please read the brief carefully and upload your work before the deadline.',
      createdAt: daysFromNow(-3),
    },
    {
      module: databases._id,
      author: murphy._id,
      title: 'Lab moved this week',
      body: 'This week only, the lab is in room B-104 instead of A-012.',
      createdAt: daysFromNow(-2),
    },
    {
      module: networks._id,
      author: kelly._id,
      title: 'Guest lecture next Thursday',
      body: 'We have a guest speaker from industry. Attendance is expected.',
      createdAt: daysFromNow(-1),
    },
  ]);

  // ----- Assignments -----
  const [portfolio, pastEssay, erDiagram, subnetting] = await Assignment.create([
    {
      module: webdev._id,
      title: 'Assignment 1: Personal portfolio page',
      description: 'Build a one-page portfolio site and upload it as a zip or PDF report.',
      dueDate: daysFromNow(14),
      maxMarks: 100,
    },
    {
      module: webdev._id,
      title: 'Short essay: History of the web',
      description: 'A 500-word essay on how the web has changed since 1991.',
      dueDate: daysFromNow(-5),
      maxMarks: 50,
    },
    {
      module: databases._id,
      title: 'ER diagram exercise',
      description: 'Design an entity-relationship diagram for a library system.',
      dueDate: daysFromNow(7),
      maxMarks: 100,
    },
    {
      module: networks._id,
      title: 'Subnetting worksheet',
      description: 'Complete the worksheet and upload your answers.',
      dueDate: daysFromNow(10),
      maxMarks: 40,
    },
  ]);

  // ----- Example submissions (so the grading pages are not empty) -----
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(
    path.join(uploadDir, 'seed-sarah-essay.txt'),
    'Demo essay submitted by Sarah Byrne (synthetic data).\n'
  );
  fs.writeFileSync(
    path.join(uploadDir, 'seed-tom-essay.txt'),
    'Demo essay submitted by Tom Walsh (synthetic data).\n'
  );

  await Submission.create([
    {
      assignment: pastEssay._id,
      student: sarah._id,
      filename: 'seed-sarah-essay.txt',
      originalName: 'history-of-the-web.txt',
      comment: 'Here is my essay.',
      submittedAt: daysFromNow(-6),
      grade: 42,
      feedback: 'Well structured and clearly written. Add more references next time.',
      gradedBy: murphy._id,
      gradedAt: daysFromNow(-4),
    },
    {
      assignment: pastEssay._id,
      student: tom._id,
      filename: 'seed-tom-essay.txt',
      originalName: 'web-essay-tom.txt',
      comment: '',
      submittedAt: daysFromNow(-5),
    },
  ]);

  console.log('Demo data added.');
  console.log('  Admin:    admin@portal.test / Admin123!');
  console.log('  Lecturer: j.murphy@portal.test / Lecturer123!');
  console.log('  Student:  s.byrne@portal.test / Student123!');

  return { admin, erDiagram, subnetting, portfolio };
}

module.exports = seedDatabase;

// Allow running this file directly: node src/seed.js
if (require.main === module) {
  const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/student_portal';

  (async () => {
    await mongoose.connect(MONGO_URL);
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Module.deleteMany({}),
      Announcement.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
    ]);
    await seedDatabase();
    await mongoose.disconnect();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

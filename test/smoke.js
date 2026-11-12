// Functional smoke test: checks that the main flows of the portal work for each role.
//
// Usage (the app must be running with the demo data loaded):
//   npm test
//   BASE_URL=http://localhost:3000 node test/smoke.js
//
// It creates its own test user, module, announcement, assignment and submission,
// and deletes them again at the end.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed++;
    console.log('  ok    ' + name);
  } else {
    failed++;
    console.log('  FAIL  ' + name);
  }
}

// A tiny HTTP client that remembers the session cookie, like a browser would
class Client {
  constructor() {
    this.cookie = '';
  }

  async request(path, options = {}) {
    const res = await fetch(BASE_URL + path, {
      redirect: 'manual',
      ...options,
      headers: { ...(options.headers || {}), cookie: this.cookie },
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0];
    const body = await res.text();
    return { status: res.status, location: res.headers.get('location'), body };
  }

  get(path) {
    return this.request(path);
  }

  post(path, fields = {}) {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
      if (Array.isArray(value)) value.forEach((v) => body.append(key, v));
      else body.append(key, value);
    }
    return this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  upload(path, fields, fileName, fileContent) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    form.append('file', new Blob([fileContent], { type: 'text/plain' }), fileName);
    return this.request(path, { method: 'POST', body: form });
  }

  async login(email, password) {
    await this.post('/login', { email, password });
    return this.get('/');
  }
}

async function main() {
  const stamp = Date.now();
  const student = new Client();
  const lecturer = new Client();
  const admin = new Client();
  const anonymous = new Client();

  console.log('\nLogin and sessions');
  let res = await anonymous.get('/');
  check('visitors are sent to the login page', res.status === 302 && res.location === '/login');

  await anonymous.post('/login', { email: 's.byrne@portal.test', password: 'wrong-password' });
  res = await anonymous.get('/login');
  check('wrong password is rejected', res.body.includes('Invalid email or password'));

  res = await student.login('s.byrne@portal.test', 'Student123!');
  check('student can log in and sees their dashboard', res.status === 200 && res.body.includes('My modules'));
  check('student dashboard lists an enrolled module', res.body.includes('COMP101'));

  console.log('\nRoles');
  res = await student.get('/admin/users');
  check('student cannot open the admin user list', res.status === 403);
  res = await student.post('/modules/000000000000000000000000/announcements', { title: 'x', body: 'x' });
  check('student cannot post announcements', res.status === 403);

  res = await lecturer.login('j.murphy@portal.test', 'Lecturer123!');
  check('lecturer can log in', res.status === 200 && res.body.includes('Modules I teach'));
  res = await lecturer.get('/admin/users');
  check('lecturer cannot open the admin user list', res.status === 403);
  res = await lecturer.get('/grades');
  check('lecturer cannot open the student grades page', res.status === 403);

  res = await admin.login('admin@portal.test', 'Admin123!');
  check('admin can log in', res.status === 200 && res.body.includes('Administration'));

  console.log('\nAdmin: users');
  const testEmail = 'test.user.' + stamp + '@portal.test';
  await admin.post('/admin/users', {
    name: 'Test User ' + stamp,
    email: testEmail,
    password: 'TestUser123!',
    role: 'student',
    studentNumber: 'T' + stamp,
  });
  res = await admin.get('/admin/users?q=' + encodeURIComponent(testEmail));
  check('admin can create a user and find them by search', res.body.includes('Test User ' + stamp));
  const testUserId = (res.body.match(/\/admin\/users\/([a-f0-9]{24})\/edit/) || [])[1];

  const newStudent = new Client();
  res = await newStudent.login(testEmail, 'TestUser123!');
  check('the new user can log in', res.status === 200);

  await admin.post('/admin/users/' + testUserId, {
    name: 'Test User ' + stamp,
    email: testEmail,
    password: '',
    role: 'lecturer',
  });
  res = await admin.get('/admin/users/' + testUserId + '/edit');
  check('admin can change a user role', /value="lecturer" selected/.test(res.body));

  console.log('\nAdmin: modules');
  // Dr. Murphy will teach the test module (find her id on the new-module form)
  res = await admin.get('/admin/modules/new');
  const murphyId = (res.body.match(/value="([a-f0-9]{24})"[^>]*>\s*Dr\. Joan Murphy/) || [])[1];
  res = await admin.post('/admin/modules', {
    code: 'TEST' + stamp,
    title: 'Smoke Test Module',
    description: 'Created by the smoke test',
    lecturer: murphyId,
  });
  const moduleId = (res.location || '').split('/').pop();
  res = await admin.get('/modules/' + moduleId);
  check('admin can create a module', res.status === 200 && res.body.includes('Smoke Test Module'));

  // Enrol Sarah (find her id on the module form)
  res = await admin.get('/admin/modules/' + moduleId + '/edit');
  const sarahId = (res.body.match(/value="([a-f0-9]{24})"[^>]*>\s*Sarah Byrne/) || [])[1];
  await admin.post('/admin/modules/' + moduleId, {
    code: 'TEST' + stamp,
    title: 'Smoke Test Module (edited)',
    description: 'Created by the smoke test',
    lecturer: murphyId,
    students: [sarahId],
  });
  res = await admin.get('/modules/' + moduleId);
  check('admin can edit a module and enrol a student', res.body.includes('(edited)') && res.body.includes('Sarah Byrne'));

  console.log('\nLecturer: announcements and assignments');
  await lecturer.post('/modules/' + moduleId + '/announcements', {
    title: 'Smoke announcement',
    body: 'Hello from the smoke test',
  });
  res = await lecturer.get('/modules/' + moduleId);
  check('lecturer can post an announcement', res.body.includes('Smoke announcement'));
  const announcementId = (res.body.match(/\/announcements\/([a-f0-9]{24})\/edit/) || [])[1];

  await lecturer.post('/announcements/' + announcementId, { title: 'Smoke announcement v2', body: 'Edited' });
  res = await lecturer.get('/modules/' + moduleId);
  check('lecturer can edit an announcement', res.body.includes('Smoke announcement v2'));

  res = await lecturer.post('/modules/' + moduleId + '/assignments', {
    title: 'Smoke assignment',
    description: 'Upload anything',
    dueDate: '2030-01-01T12:00',
    maxMarks: '50',
  });
  const assignmentId = (res.location || '').split('/').pop();
  res = await lecturer.get('/assignments/' + assignmentId);
  check('lecturer can create an assignment', res.status === 200 && res.body.includes('Smoke assignment'));

  await lecturer.post('/assignments/' + assignmentId, {
    title: 'Smoke assignment (edited)',
    description: 'Upload anything',
    dueDate: '2030-02-01T12:00',
    maxMarks: '60',
  });
  res = await lecturer.get('/assignments/' + assignmentId);
  check('lecturer can edit an assignment', res.body.includes('(edited)') && res.body.includes('60'));

  console.log('\nStudent: submissions and grades');
  res = await student.get('/');
  check('student sees the new assignment on their dashboard', res.body.includes('Smoke assignment (edited)'));

  await student.upload('/assignments/' + assignmentId + '/submit', { comment: 'My work' }, 'report.txt', 'first version');
  res = await student.get('/assignments/' + assignmentId);
  check('student can upload a submission', res.body.includes('report.txt'));
  const submissionId = (res.body.match(/\/submissions\/([a-f0-9]{24})\/download/) || [])[1];

  res = await student.get('/submissions/' + submissionId + '/download');
  check('student can download their file', res.status === 200 && res.body === 'first version');

  await student.upload('/assignments/' + assignmentId + '/submit', { comment: 'Updated' }, 'report-v2.txt', 'second version');
  res = await student.get('/submissions/' + submissionId + '/download');
  check('student can replace their submission', res.body === 'second version');

  res = await lecturer.get('/assignments/' + assignmentId);
  check('lecturer sees the submission', res.body.includes('Sarah Byrne') && res.body.includes('report-v2.txt'));

  await lecturer.post('/submissions/' + submissionId + '/grade', { grade: '55', feedback: 'Good work' });
  res = await student.get('/grades');
  check('student sees the grade and feedback', res.body.includes('<strong>55</strong>') && res.body.includes('Good work'));

  console.log('\nProfile');
  await student.post('/profile', {
    name: 'Sarah Byrne',
    phone: '085 111 ' + String(stamp).slice(-4),
    address: '1 Example Street, Dublin 15',
    dateOfBirth: '2004-03-12',
  });
  res = await student.get('/profile');
  check('student can update their profile', res.body.includes('085 111 ' + String(stamp).slice(-4)));

  await newStudent.post('/profile/password', { currentPassword: 'TestUser123!', newPassword: 'Changed123!' });
  const relogin = new Client();
  res = await relogin.login(testEmail, 'Changed123!');
  check('a user can change their password', res.status === 200);

  console.log('\nClean up (delete flows)');
  await student.post('/submissions/' + submissionId + '/delete');
  res = await student.get('/assignments/' + assignmentId);
  check('student can delete their submission', res.body.includes('You have not submitted anything yet'));

  await lecturer.post('/announcements/' + announcementId + '/delete');
  res = await lecturer.get('/modules/' + moduleId);
  check('lecturer can delete an announcement', !res.body.includes('Smoke announcement v2'));

  await lecturer.post('/assignments/' + assignmentId + '/delete');
  res = await lecturer.get('/assignments/' + assignmentId);
  check('lecturer can delete an assignment', res.status === 404);

  await admin.post('/admin/modules/' + moduleId + '/delete');
  res = await admin.get('/modules/' + moduleId);
  check('admin can delete a module', res.status === 404);

  await admin.post('/admin/users/' + testUserId + '/delete');
  res = await admin.get('/admin/users?q=' + encodeURIComponent(testEmail));
  check('admin can delete a user', !res.body.includes('Test User ' + stamp));

  console.log('\nLogout');
  await student.get('/logout');
  res = await student.get('/');
  check('after logging out the dashboard needs a login again', res.status === 302 && res.location === '/login');

  console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'W/QPgoTecbLNIJND5b0iialL9wiw1wJWcg9RaAi5hXUwKq94Um+PdJcIEGl8rQvAym4nvpNgxMOvS3/+ylnJBQ==';
const API_URL = 'https://api.labs-schickeria.com/api/projects';

// Create a fake admin token
const token = jwt.sign(
  {
    userId: '00000000-0000-0000-0000-000000000000',
    email: 'admin@test.com',
    role: 'admin'
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testStatus(statusValue) {
  const payload = {
    title: `Test Project ${statusValue}`,
    client_id: '00000000-0000-0000-0000-000000000001',
    description: 'Test',
    category: 'other',
    status: statusValue,
    budget_total: 0,
    start_date: null,
    deadline: null,
    color_code: '#000000'
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { status: statusValue, data };
  } catch (err) {
    return { status: statusValue, error: err.message };
  }
}

async function run() {
  const testValues = ['todo', 'planning', 'inquiry', 'requested', 'prospect', 'prospecting', 'quote', 'quoted', 'negotiation'];
  const results = [];
  for (const v of testValues) {
    results.push(await testStatus(v));
  }
  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
}

run();

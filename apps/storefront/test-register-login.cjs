const http = require('http');

const API_KEY = "pk_1f40fb864c3b636f387432c8788dc4b8de3380f9c9fc497bb12f88cf654a3af8";

function makeRequest(path, method, bodyObj, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = bodyObj ? JSON.stringify(bodyObj) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 9000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-publishable-api-key': API_KEY,
        ...headers
      }
    }, (res) => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: resBody }));
    });
    req.on('error', reject);
    if (bodyObj) req.write(data);
    req.end();
  });
}

async function run() {
  const email = `test.${Date.now()}@example.com`;
  const password = "Password123!";
  
  console.log("1. Registering", email);
  const regRes = await makeRequest('/store/customers/register', 'POST', {
    email,
    password,
    first_name: "Test",
    last_name: "User"
  });
  console.log("Register response:", regRes.status, regRes.body);
  
  console.log("\n2. Logging in (emailpass)");
  const loginRes = await makeRequest('/auth/customer/emailpass', 'POST', {
    email,
    password
  });
  console.log("Emailpass response:", loginRes.status, loginRes.body);
  const token = JSON.parse(loginRes.body).token;
  
  console.log("\n3. Creating session (auth/session)");
  const sessionRes = await makeRequest('/auth/session', 'POST', {}, {
    'Authorization': `Bearer ${token}`
  });
  console.log("Session response:", sessionRes.status);
  console.log("Session headers:", JSON.stringify(sessionRes.headers, null, 2));
  
  const setCookie = sessionRes.headers['set-cookie'];
  console.log("Set-Cookie:", setCookie);
}

run().catch(console.error);

const http = require('http');

const data = JSON.stringify({
  email: "joao@example.com",
  password: "Password123!"
});

const options = {
  hostname: 'localhost',
  port: 9000,
  path: '/auth/customer/emailpass',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('--- /auth/customer/emailpass ---');
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('BODY:', body);
    
    // Now call /auth/session with the token
    const token = JSON.parse(body).token;
    
    const sessionReq = http.request({
      hostname: 'localhost',
      port: 9000,
      path: '/auth/session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, (sessionRes) => {
      console.log('\n--- /auth/session ---');
      console.log(`STATUS: ${sessionRes.statusCode}`);
      console.log('HEADERS:', JSON.stringify(sessionRes.headers, null, 2));
      let sBody = '';
      sessionRes.on('data', d => sBody += d);
      sessionRes.on('end', () => console.log('BODY:', sBody));
    });
    sessionReq.end();
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();

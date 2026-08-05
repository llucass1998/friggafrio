const { execSync } = require('child_process');

try {
  execSync('npx playwright test tests/test-auth-protection-e2e.spec.ts', { stdio: 'inherit' });
} catch (e) {
  console.log("Failed but ignore for script execution.");
}

const { Medusa } = require("@medusajs/js-sdk");
require("dotenv").config({ path: ".env" });

const sdk = new Medusa({
  baseUrl: "http://localhost:9000",
  maxRetries: 0,
  publishableKey: "pk_e630a8a6efe3d9d95a3f9208909c0f345897e1fb2376fd05a214e7aa4ed04c69",
});

async function run() {
  console.log("Teste de Store API via SDK...");
  try {
    const { regions } = await sdk.store.region.list();
    console.log("Regions obtidas:", regions.length);
    
    // Fake cart create since backend is mocked or failing
    // We'll see what the SDK is attempting to call when we trace it.
    
  } catch (err) {
    console.error("SDK Error:", err.message);
  }
}
run();

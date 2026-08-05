import Medusa from "@medusajs/js-sdk";

const sdk = new Medusa({
  baseUrl: "http://localhost:9000",
  maxRetries: 0,
  publishableKey: "pk_e630a8a6efe3d9d95a3f9208909c0f345897e1fb2376fd05a214e7aa4ed04c69",
});

async function run() {
  console.log("Mocking fetch to intercept SDK calls...");
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    console.log("\n-> FETCH CALLED:");
    console.log("URL:", args[0]);
    if (args[1]) {
       console.log("METHOD:", args[1].method || "GET");
       console.log("BODY:", args[1].body);
    }
    // throw so we stop execution after printing
    return new Response(JSON.stringify({ error: "Intercepted" }), { status: 400 });
  };

  try {
    const { cart } = await sdk.store.cart.create({ region_id: "reg_123" });
    console.log(cart);
  } catch (err) {
    console.log("Erro capturado:", err.message);
  }

  try {
    await sdk.store.cart.createLineItem("cart_123", { variant_id: "var_123", quantity: 1 });
  } catch (err) {}
}
run();

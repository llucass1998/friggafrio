const { MetadataStorage } = require("@mikro-orm/core");
const { loadEnv } = require("@medusajs/framework/utils");
const path = require("node:path");

loadEnv("test", path.resolve(__dirname, ".."));

const integrationDatabaseUrl = process.env.TEST_DATABASE_URL;

if (process.env.TEST_TYPE?.startsWith("integration:")) {
  if (!integrationDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for integration tests");
  }

  const parsedDatabaseUrl = new URL(integrationDatabaseUrl);

  if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
    throw new Error("TEST_DATABASE_URL must use the PostgreSQL protocol");
  }

  if (
    !parsedDatabaseUrl.hostname ||
    !parsedDatabaseUrl.username ||
    !parsedDatabaseUrl.password
  ) {
    throw new Error(
      "TEST_DATABASE_URL must include host, username and password",
    );
  }

  const databaseName = decodeURIComponent(
    parsedDatabaseUrl.pathname.replace(/^\//, ""),
  );

  if (!databaseName || !/test/i.test(databaseName)) {
    throw new Error(
      "TEST_DATABASE_URL must target an explicitly named test database",
    );
  }

  process.env.DB_HOST = parsedDatabaseUrl.hostname;
  process.env.DB_PORT = parsedDatabaseUrl.port || "5432";
  process.env.DB_USERNAME = decodeURIComponent(parsedDatabaseUrl.username);
  process.env.DB_PASSWORD = decodeURIComponent(parsedDatabaseUrl.password);
}

MetadataStorage.clear();

const unitTests = ["<rootDir>/src/**/*.unit.spec.ts"];
const httpIntegrationTests = [
  "<rootDir>/integration-tests/http/**/*.spec.ts",
];
const moduleIntegrationTests = [
  "<rootDir>/src/modules/**/__tests__/**/*.spec.ts",
  "<rootDir>/integration-tests/modules/**/*.spec.ts",
];

const testType = process.env.TEST_TYPE ?? "unit";
const testMatchByType = {
  unit: unitTests,
  "integration:http": httpIntegrationTests,
  "integration:modules": moduleIntegrationTests,
};

if (!(testType in testMatchByType)) {
  throw new Error(`Unsupported TEST_TYPE: ${testType}`);
}

module.exports = {
  testEnvironment: "node",
  testMatch: testMatchByType[testType],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2021",
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
            react: {
              runtime: "automatic",
            },
          },
        },
        module: {
          type: "commonjs",
        },
        sourceMaps: "inline",
      },
    ],
  },
  setupFilesAfterEnv: testType.startsWith("integration:")
    ? ["<rootDir>/integration-tests/setup.js"]
    : [],
};

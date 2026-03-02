export default {
    testEnvironment: "node",
    transform: {},
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    verbose: true,
    testTimeout: 30000,
};

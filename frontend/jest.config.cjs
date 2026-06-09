module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleFileExtensions: ["js", "jsx"],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(react-router|react-router-dom)/)",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(js|jsx)",
    "<rootDir>/src/**/*.(test|spec).(js|jsx)",
  ],
  collectCoverageFrom: [
    "src/pages/auth/LoginPage.jsx",
    "src/pages/admin/AdminDashboard.jsx",
    "src/pages/student/StudentTimetablePage.jsx",
    "src/components/common/{Button,Input,Loader,EmptyState}.jsx",
    "src/components/dashboard/StatCard.jsx",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

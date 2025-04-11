export const ZodMessages = {
  common: {
    invalidUUID: "Invalid UUID",
    invalidDate: "Invalid date format",
    positiveNumber: "Must be a positive number",
  },
  user: {
    usernameMin: "Username must be at least 3 characters",
    emailInvalid: "Invalid email address",
    passwordMin: "Password must be at least 6 characters",
    passwordConfirmMin: "Password confirmation must be at least 6 characters",
    passwordMismatch: "Passwords do not match",
  },
  metricCategory: {
    invalidId: "Invalid Metric Category ID",
    nameRequired: "Name is required",
  },
  metric: {
    categoryId: "Invalid categoryId",
    originalMetricId: "Invalid originalMetricId",
    invalidId: "Invalid Metric ID",
    nameRequired: "Name is required",
    unitRequired: "Unit is required",
  },
  metricSettings: {
    invalidGoalValue: "Goal value must be a valid number",
    goalValuePositive: "Goal value must be greater than 0",
    invalidGoalType: "Invalid goal type",
    invalidAlertThreshold: "Alert threshold must be a valid number",
    alertThresholdMin: "Alert threshold must be at least 0",
    alertThresholdMax: "Alert threshold must be at most 100",
    invalidMetricId: "Invalid metric ID",
    invalidMetricSettingsId: "Invalid metric settings ID",
  },
  metricLog: {
    invalidId: "Invalid Metric Log ID",
    invalidMetricId: "Invalid Metric ID",
    logValueRequired: "Log value is required",
    logValueNonNegative: "Log value must be non-negative",
    logTypeInvalid: "Invalid log type",
    logDateInvalid: "Invalid date format",
  },
};

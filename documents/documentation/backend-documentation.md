# Backend Documentation

## zod-metric-category.schema.ts

```typescript
// src/types/api/metric-category.schema.ts

import { z } from "zod";
import { ZodMessages } from "@/constants/zod-messages";
import {
  zMetricCategoryName,
  zMetricCategoryColor,
  zMetricCategoryIcon,
} from "@/validators/zod-rules";

/**
 * * Metric Category Schema Validator
 * Defines validation schemas for metric category-related requests.
 */

// CREATE MetricCategory Schema
export const createMetricCategorySchema = z.object({
  body: z.object({
    name: zMetricCategoryName,
    color: zMetricCategoryColor,
    icon: zMetricCategoryIcon,
  }),
});

// UPDATE MetricCategory Schema
export const updateMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
  }),
  body: z.object({
    name: zMetricCategoryName.optional(),
    color: zMetricCategoryColor.optional(),
    icon: zMetricCategoryIcon.optional(),
  }),
});

// GET MetricCategory Schema
export const getMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
  }),
});

// DELETE MetricCategory Schema
export const deleteMetricCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: ZodMessages.metricCategory.invalidId }),
  }),
});

```

## zod-metric-log.schema.ts

```typescript
// src/types/api/zod-metric-log.schema.ts

import { z } from "zod";
import {
  zUUID,
  zLogType,
  zPositiveFloat,
  zDateOptional,
} from "@/validators/zod-rules";

export const createMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
  body: z.object({
    type: zLogType.optional().default("manual"),
    logValue: zPositiveFloat,
    loggedAt: zDateOptional,
  }),
});

export const updateMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
  body: z.object({
    type: zLogType.optional(),
    logValue: zPositiveFloat.optional(),
    loggedAt: zDateOptional,
  }),
});

export const getMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const getAllMetricLogsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
});

export const deleteMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const getAggregatedStatsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
});

```

## zod-metric-settings.schema.ts

```typescript
// src/types/api/zod-metric-settings.schema.ts

import { z } from "zod";
import {
  zUUID,
  zDateOptional,
  zGoalValue,
  zGoalType,
  zAlertThresholds,
  zDisplayOptions,
} from "@/validators/zod-rules";

export const createMetricSettingsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
  body: z
    .object({
      goalEnabled: z.boolean().optional().default(false),
      goalType: zGoalType,
      goalValue: zGoalValue,
      timeFrameEnabled: z.boolean().optional().default(false),
      startDate: zDateOptional.optional().nullable(),
      deadlineDate: zDateOptional.optional().nullable(),
      alertEnabled: z.boolean().optional().default(false),
      alertThresholds: zAlertThresholds,
      displayOptions: zDisplayOptions,
    })
    .refine(
      (data) => {
        if (data.goalEnabled) {
          return data.goalType !== null && data.goalValue !== null;
        }
        return true;
      },
      {
        message:
          "goalType and goalValue are required when goalEnabled is true.",
      },
    )
    .refine(
      (data) => {
        if (data.timeFrameEnabled) {
          return (
            data.startDate &&
            data.deadlineDate &&
            data.deadlineDate > data.startDate
          );
        }
        return true;
      },
      {
        message:
          "startDate and deadlineDate are required, and deadlineDate must be after startDate when timeFrameEnabled is true.",
      },
    ),
});

export const updateMetricSettingsSchema = createMetricSettingsSchema.extend({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const getMetricSettingsSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const deleteMetricSettingsSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

```

## zod-metric.schema.ts

```typescript
// ✅ src/types/api/zod-metric.schema.ts

import { z } from "zod";
import {
  zUUID,
  zMetricName,
  zMetricCategoryId,
  zMetricDescription,
  zMetricDefaultUnit,
  zMetricIsPublic,
  zMetricOriginalId,
  zMetricDeletedAt,
} from "@/validators/zod-rules";

export const createMetricSchema = z.object({
  body: z.object({
    categoryId: zMetricCategoryId.optional(),
    originalMetricId: zMetricOriginalId.optional(),
    name: zMetricName,
    description: zMetricDescription.optional(),
    defaultUnit: zMetricDefaultUnit,
    isPublic: zMetricIsPublic,
    // deletedAt should likely not be part of create/update via API
    // deletedAt: zMetricDeletedAt,
  }),
});

export const updateMetricSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
  // Make all fields optional for update
  body: z.object({
    categoryId: zMetricCategoryId.optional(),
    originalMetricId: zMetricOriginalId.optional(),
    name: zMetricName.optional(),
    description: zMetricDescription.optional(),
    defaultUnit: zMetricDefaultUnit.optional(),
    isPublic: zMetricIsPublic.optional(),
    // deletedAt should likely not be part of create/update via API
    // deletedAt: zMetricDeletedAt.optional(),
  }),
});

export const getMetricSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const deleteMetricSchema = getMetricSchema;

// Infer TypeScript types from schemas
export type CreateMetricInput = z.infer<typeof createMetricSchema>["body"];
export type UpdateMetricInput = z.infer<typeof updateMetricSchema>; // Includes params and body
export type GetMetricInput = z.infer<typeof getMetricSchema>["params"];
export type DeleteMetricInput = z.infer<typeof deleteMetricSchema>["params"];

```

## zod-user.schema.ts

```typescript
// src/types/api/zod-user.schema.ts

import { z } from "zod";
import { ZodMessages } from "@/constants/zod-messages";
import {
  zUsername,
  zEmail,
  zPassword,
  zPasswordConfirmation,
  zPublicProfile,
  zRole,
} from "@/validators/zod-rules";

/**
 * * Zod Validation + Inferred Types
 */

/**
 * Create User Schema
 * Used for validating incoming data when creating a new user.
 */

export const createUserSchema = z.object({
  body: z
    .object({
      username: zUsername,
      email: zEmail,
      password: zPassword,
      passwordConfirmation: zPasswordConfirmation,
      isPublicProfile: zPublicProfile,
      role: zRole,
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: ZodMessages.user.passwordMismatch,
      path: ["passwordConfirmation"],
    }),
});

export type CreateUserRequestDTO = z.infer<typeof createUserSchema.shape.body>;

/**
 * Update User Schema
 * Used for validating incoming data when updating a user.
 */
export const updateUserSchema = z.object({
  body: z.object({
    username: zUsername.optional(),
    email: zEmail.optional(),
    password: zPassword.optional(),
    isPublicProfile: zPublicProfile.optional(),
    role: zRole.optional(),
  }),
});

export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema.shape.body>;

// src/types/api/zod-user.schema.ts

// import { z } from "zod";

/**
 * * Zod Validation + Inferred Types
 * Wrapped in `.object({ body })` to support validation for body, params, and query via middleware
 */

// ✅ Create User Schema
// export const createUserSchema = z.object({
//   body: z
//     .object({
//       username: z
//         .string()
//         .min(3, { message: "Username must be at least 3 characters" }),
//       email: z.string().email({ message: "Invalid email address" }),
//       password: z
//         .string()
//         .min(6, { message: "Password must be at least 6 characters" }),
//       passwordConfirmation: z.string().min(6, {
//         message: "Password confirmation must be at least 6 characters",
//       }),
//       isPublicProfile: z.boolean().optional().default(true),
//       role: z.enum(["user", "admin"]).optional().default("user"),
//     })
//     .refine((data) => data.password === data.passwordConfirmation, {
//       message: "Passwords do not match",
//       path: ["passwordConfirmation"],
//     }),
// });

// export type CreateUserRequestDTO = z.infer<typeof createUserSchema.shape.body>;

// // ✅ Update User Schema
// export const updateUserSchema = z.object({
//   body: z.object({
//     username: z.string().min(3).optional(),
//     email: z.string().email().optional(),
//     password: z.string().min(6).optional(),
//     isPublicProfile: z.boolean().optional(),
//     role: z.enum(["user", "admin"]).optional(),
//   }),
// });

// export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema.shape.body>;

```

## metric-category.types.ts

```typescript
// src/types/db/metric-category.types.ts

/**
 * @interface MetricCategoryAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric Category entity.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, userId, timestamps, etc.
 */
export interface MetricCategoryAttributesBase {
  /**
   * @property {string} name - The user-defined name for the metric category.
   */
  name: string;

  /**
   * @property {string} color - A color code (e.g., hex) associated with the category for UI display.
   * Defaults to '#E897A3' if not provided.
   */
  color: string;

  /**
   * @property {string} icon - An icon identifier (e.g., emoji or icon font class) associated with the category.
   * Defaults to '📁' if not provided.
   */
  icon: string;

  /**
   * @property {Date | null} [deletedAt] - Timestamp indicating when the category was soft-deleted.
   * If null or undefined, the category is considered active. Used by Sequelize's paranoid mode.
   */
  deletedAt?: Date | null;
}

```

## metric-log.types.ts

```typescript
// src/types/db/metric-log.types.ts

/**
 * @interface MetricLogAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric Log entity.
 * This represents a single data point recorded for a specific metric.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, metricId, timestamps, etc.
 */
export interface MetricLogAttributesBase {
  /**
   * @property {'manual' | 'automatic'} type - Indicates how the log entry was created.
   * 'manual': Entered directly by the user.
   * 'automatic': Potentially sourced from an integration or automated process (future use).
   * Defaults to 'manual'.
   */
  type: "manual" | "automatic";

  /**
   * @property {number} logValue - The numerical value recorded for the metric at the time of logging.
   * Must be greater than 0.
   */
  logValue: number;

  /**
   * @property {Date} [loggedAt] - The timestamp when the metric value was actually recorded or measured.
   * Defaults to the time of creation (NOW()) if not provided.
   * Note: While optional here for potential object creation before DB default, it's required in the DB.
   */
  loggedAt?: Date;
}

```

## metric-settings.types.ts

```typescript
// src/types/db/metric-settings.types.ts

/**
 * @interface MetricDisplayOptions
 * @description Defines options related to how a metric is displayed in the user interface.
 */
export interface MetricDisplayOptions {
  /**
   * @property {boolean} showOnDashboard - Whether the metric should be prominently displayed on the user's dashboard.
   */
  showOnDashboard: boolean;
  /**
   * @property {number | null} priority - A numerical priority for ordering metrics on the dashboard or lists. Lower numbers might indicate higher priority. Null if not prioritized.
   */
  priority: number | null;
  /**
   * @property {string | null} chartType - The preferred chart type for visualizing the metric's data (e.g., 'line', 'bar'). Null if no preference.
   */
  chartType: string | null;
  /**
   * @property {string | null} color - A specific color code (e.g., hex) to associate with the metric's display. Null for default color.
   */
  color: string | null;
}

/**
 * @interface MetricSettingsAttributesBase
 * @description Defines the core, non-database-specific attributes for Metric Settings.
 * These settings allow users to customize goals, timeframes, alerts, and display options for a specific metric.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, metricId, timestamps, etc.
 */
export interface MetricSettingsAttributesBase {
  /**
   * @property {boolean} goalEnabled - Whether a goal is currently active for this metric. Defaults to false.
   */
  goalEnabled: boolean;
  /**
   * @property {'cumulative' | 'incremental' | null} [goalType] - The type of goal, if enabled.
   * 'cumulative': Goal is based on the total sum of log values over the timeframe.
   * 'incremental': Goal is based on achieving a specific value in a single log entry.
   * Null if goal is disabled.
   */
  goalType?: "cumulative" | "incremental" | null;
  /**
   * @property {number | null} [goalValue] - The target value for the goal, if enabled. Must be > 0 if set. Null if goal is disabled.
   */
  goalValue?: number | null;
  /**
   * @property {boolean} timeFrameEnabled - Whether a specific time frame (start/deadline) is active for the goal. Defaults to false.
   */
  timeFrameEnabled: boolean;
  /**
   * @property {Date | null} [startDate] - The start date for the goal's time frame, if enabled. Represents the date only (YYYY-MM-DD). Null if timeframe is disabled.
   */
  startDate?: Date | null;
  /**
   * @property {Date | null} [deadlineDate] - The deadline date for the goal's time frame, if enabled. Represents the date only (YYYY-MM-DD). Must be after startDate if both are set. Null if timeframe is disabled.
   */
  deadlineDate?: Date | null;
  /**
   * @property {boolean} alertEnabled - Whether alerts are active for this metric's goal progress. Defaults to false.
   */
  alertEnabled: boolean;
  /**
   * @property {number | null} [alertThresholds] - The percentage threshold (0-100) at which to trigger an alert regarding goal progress, if alerts are enabled. Defaults to 80. Null if alerts are disabled.
   */
  alertThresholds?: number | null;
  /**
   * @property {boolean} isAchieved - Flag indicating if the goal (if enabled) has been met. Defaults to false. Logic for setting this likely resides in the service layer.
   */
  isAchieved: boolean;
  /**
   * @property {boolean} isActive - Flag indicating if these settings are currently active and should be considered. Defaults to true. Allows disabling settings without deleting.
   */
  isActive: boolean;
  /**
   * @property {MetricDisplayOptions} displayOptions - Object containing settings related to how the metric is displayed.
   */
  displayOptions: MetricDisplayOptions;
}

```

## metric.types.ts

```typescript
// src/types/db/metric.types.ts

/**
 * @interface MetricAttributesBase
 * @description Defines the core, non-database-specific attributes for a Metric entity.
 * Represents a specific health or activity metric that a user can track (e.g., 'Weight', 'Steps', 'Water Intake').
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, userId, categoryId, timestamps, etc.
 */
export interface MetricAttributesBase {
  /**
   * @property {string} name - The user-defined name for the metric.
   */
  name: string;

  /**
   * @property {string | null} [description] - An optional description providing more details about the metric.
   */
  description?: string | null;

  /**
   * @property {string} defaultUnit - The default unit of measurement for this metric (e.g., 'kg', 'steps', 'ml').
   */
  defaultUnit: string;

  /**
   * @property {boolean} isPublic - Flag indicating if this metric definition (not the user's data) can be publicly discovered or used as a template by others. Defaults to true.
   */
  isPublic: boolean;

  /**
   * @property {Date | null} [deletedAt] - Timestamp indicating when the metric was soft-deleted.
   * If null or undefined, the metric is considered active. Used by Sequelize's paranoid mode.
   */
  deletedAt?: Date | null;
}

```

## user.types.ts

```typescript
// src/types/db/user.types.ts

/**
 * @interface UserAttributesBase
 * @description Defines the core, non-database-specific attributes for a User entity.
 * This interface is typically extended by the Sequelize model's attributes interface
 * to include database-managed fields like id, timestamps, etc.
 */
export interface UserAttributesBase {
  /**
   * @property {string} username - The unique username for the user.
   */
  username: string;

  /**
   * @property {string} email - The unique email address for the user. Must be a valid email format.
   */
  email: string;

  /**
   * @property {string} password - The user's password. Note: This is typically the hashed password in the database context.
   */
  password: string;

  /**
   * @property {boolean} isPublicProfile - Flag indicating if the user's profile is publicly visible.
   */
  isPublicProfile: boolean;

  /**
   * @property {'user' | 'admin'} role - The role assigned to the user, determining their permissions.
   */
  role: "user" | "admin";
}

```

## metric-category.domain.ts

```typescript
/**
 * @file src/types/domain/metric-category.domain.ts
 * @description Defines the domain model interface for a Metric Category.
 * This represents a category used to group metrics within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface MetricCategoryDomain
 * @description Represents a metric category within the application's core domain logic.
 * Contains essential category information retrieved from the persistence layer.
 */
export interface MetricCategoryDomain {
  /**
   * @property {string} id - The unique identifier for the metric category (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The user-defined name for the category.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string} color - The color code associated with the category for UI display.
   * @readonly
   */
  readonly color: string;

  /**
   * @property {string} icon - The icon identifier associated with the category.
   * @readonly
   */
  readonly icon: string;

  /**
   * @property {Date} createdAt - The timestamp when the category was created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the category was last updated.
   * @readonly
   */
  readonly updatedAt: Date;

  /**
   * @property {Date | null} [deletedAt] - The timestamp when the category was soft-deleted. Null if active.
   * @readonly
   */
  readonly deletedAt?: Date | null;
}

```

## metric-log.domain.ts

```typescript
/**
 * @file src/types/domain/metric-log.domain.ts
 * @description Defines the domain model interface for a Metric Log entry.
 * This represents a single recorded data point for a metric within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface MetricLogDomain
 * @description Represents a single log entry for a metric within the application's core domain logic.
 * Contains essential log information retrieved from the persistence layer.
 */
export interface MetricLogDomain {
  /**
   * @property {string} id - The unique identifier for the metric log entry (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} metricId - The identifier of the metric this log entry belongs to.
   * @readonly
   */
  readonly metricId: string;

  /**
   * @property {'manual' | 'automatic'} type - Indicates how the log entry was created ('manual' or 'automatic').
   * @readonly
   */
  readonly type: "manual" | "automatic";

  /**
   * @property {number} logValue - The numerical value recorded for the metric in this log entry.
   * @readonly
   */
  readonly logValue: number;

  /**
   * @property {Date} loggedAt - The timestamp when the metric value was actually recorded or measured.
   * @readonly
   */
  readonly loggedAt: Date;

  /**
   * @property {Date} createdAt - The timestamp when the log entry was created in the database.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the log entry was last updated in the database.
   * @readonly
   */
  readonly updatedAt: Date;
}

```

## metric-settings.domain.ts

```typescript
/**
 * @file src/types/domain/metric-settings.domain.ts
 * @description Defines the domain model interfaces for Metric Settings and its display options.
 * Represents metric customization settings within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface MetricSettingsDisplayOptionsDomain
 * @description Represents display options for a metric within the domain logic.
 */
export interface MetricSettingsDisplayOptionsDomain {
  /**
   * @property {boolean} showOnDashboard - Whether the metric should be shown on the dashboard.
   * @readonly
   */
  readonly showOnDashboard: boolean;
  /**
   * @property {number | null} priority - Display priority (lower number = higher priority). Null if not set.
   * @readonly
   */
  readonly priority: number | null;
  /**
   * @property {string | null} chartType - Preferred chart type (e.g., 'line', 'bar'). Null if default.
   * @readonly
   */
  readonly chartType: string | null;
  /**
   * @property {string | null} color - Specific color code (e.g., hex). Null if default.
   * @readonly
   */
  readonly color: string | null;
}

/**
 * @interface MetricSettingsDomain
 * @description Represents the settings for a specific metric within the application's core domain logic.
 * Contains essential settings information retrieved from the persistence layer.
 */
export interface MetricSettingsDomain {
  /**
   * @property {string} id - The unique identifier for the metric settings (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} metricId - The identifier of the metric these settings apply to.
   * @readonly
   */
  readonly metricId: string;

  /**
   * @property {boolean} isActive - Flag indicating if these settings are currently active.
   * @readonly
   */
  readonly isActive: boolean;

  /**
   * @property {boolean} goalEnabled - Flag indicating if a goal is set for this metric.
   * @readonly
   */
  readonly goalEnabled: boolean;

  /**
   * @property {'cumulative' | 'incremental' | null} [goalType] - The type of goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalType?: "cumulative" | "incremental" | null;

  /**
   * @property {number | null} [goalValue] - The target value for the goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalValue?: number | null;

  /**
   * @property {boolean} timeFrameEnabled - Flag indicating if a specific time frame is set for the goal.
   * @readonly
   */
  readonly timeFrameEnabled: boolean;

  /**
   * @property {Date | null} [startDate] - The start date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly startDate?: Date | null;

  /**
   * @property {Date | null} [deadlineDate] - The deadline date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly deadlineDate?: Date | null;

  /**
   * @property {boolean} alertEnabled - Flag indicating if alerts are enabled for goal progress.
   * @readonly
   */
  readonly alertEnabled: boolean;

  /**
   * @property {number | null} [alertThresholds] - The percentage threshold (0-100) for alerts. Null if alerts are disabled.
   * @readonly
   */
  readonly alertThresholds?: number | null; // Adjusted to allow null

  /**
   * @property {boolean} isAchieved - Flag indicating if the goal has been achieved.
   * @readonly
   */
  readonly isAchieved: boolean;

  /**
   * @property {MetricSettingsDisplayOptionsDomain} displayOptions - Object containing display-related settings.
   * @readonly
   */
  readonly displayOptions: MetricSettingsDisplayOptionsDomain; // Made required

  /**
   * @property {Date} createdAt - The timestamp when these settings were created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when these settings were last updated.
   * @readonly
   */
  readonly updatedAt: Date;
}

```

## metric.domain.ts

```typescript
/**
 * @file src/types/domain/metric.domain.ts
 * @description Defines the domain model interfaces related to Metrics.
 * These represent metrics, library views of metrics, and extended metric details
 * within the core business logic, decoupled from database or API specifics.
 * Domain models are often immutable.
 */

import { MetricCategoryDomain } from "./metric-category.domain";
import { MetricLogDomain } from "./metric-log.domain";
import { MetricSettingsDomain } from "./metric-settings.domain";

/**
 * @interface MetricDomain
 * @description Represents a core metric entity within the application's domain logic.
 * Contains essential metric information retrieved from the persistence layer.
 */
export interface MetricDomain {
  /**
   * @property {string} id - The unique identifier for the metric (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} userId - The identifier of the user who owns this metric instance.
   * @readonly
   */
  readonly userId: string;

  /**
   * @property {string | null} [categoryId] - The identifier of the category this metric belongs to, if any.
   * @readonly
   */
  readonly categoryId?: string | null;

  /**
   * @property {string | null} [originalMetricId] - If this metric was created from a public template, this is the ID of the original template metric. Null otherwise.
   * @readonly
   */
  readonly originalMetricId?: string | null;

  /**
   * @property {string} name - The user-defined name for the metric.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string | null} [description] - An optional description providing more details about the metric.
   * @readonly
   */
  readonly description?: string | null;

  /**
   * @property {string} defaultUnit - The default unit of measurement for this metric (e.g., 'kg', 'steps', 'ml').
   * @readonly
   */
  readonly defaultUnit: string;

  /**
   * @property {boolean} isPublic - Flag indicating if this metric definition can be publicly discovered or used as a template.
   * @readonly
   */
  readonly isPublic: boolean;

  /**
   * @property {Date | null} [deletedAt] - The timestamp when the metric was soft-deleted. Null if active.
   * @readonly
   */
  readonly deletedAt?: Date | null;

  /**
   * @property {Date} createdAt - The timestamp when the metric was created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the metric was last updated.
   * @readonly
   */
  readonly updatedAt: Date;
}

/**
 * @interface MetricLibraryCategoryInfo
 * @description Represents summarized category information used within the metric library view.
 */
interface MetricLibraryCategoryInfo {
  /**
   * @property {string} id - The unique identifier of the category.
   * @readonly
   */
  readonly id: string;
  /**
   * @property {string} name - The name of the category.
   * @readonly
   */
  readonly name: string;
  /**
   * @property {string} icon - The icon identifier of the category.
   * @readonly
   */
  readonly icon: string;
  /**
   * @property {string} color - The color code of the category.
   * @readonly
   */
  readonly color: string;
}

/**
 * @interface MetricLibraryDomain
 * @description Represents a simplified view of a metric, typically for display in a public library or template list.
 */
export interface MetricLibraryDomain {
  /**
   * @property {string} id - The unique identifier of the metric.
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The name of the metric.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {MetricLibraryCategoryInfo} [category] - Optional summarized information about the metric's category.
   * @readonly
   */
  readonly category?: MetricLibraryCategoryInfo;

  /**
   * @property {string} [goalType] - Optional goal type associated with the metric's settings (e.g., 'cumulative', 'incremental').
   * @readonly
   */
  readonly goalType?: string; // Consider using the specific ENUM type if available/stable
}

/**
 * @type MetricLibraryListDomain
 * @description Represents a list (array) of metrics formatted for the library view.
 */
export type MetricLibraryListDomain = MetricLibraryDomain[];

/**
 * @interface MetricDomainExtended
 * @description Extends the core MetricDomain with potentially loaded relational data (category, settings, logs).
 * Useful for scenarios where related entities are needed alongside the metric itself.
 */
export interface MetricDomainExtended extends MetricDomain {
  /**
   * @property {MetricCategoryDomain} [category] - The associated metric category domain object, if loaded.
   * @readonly
   */
  readonly category?: MetricCategoryDomain;

  /**
   * @property {MetricSettingsDomain} [settings] - The associated metric settings domain object, if loaded.
   * @readonly
   */
  readonly settings?: MetricSettingsDomain;

  /**
   * @property {MetricLogDomain[]} [logs] - An array of associated metric log domain objects, if loaded.
   * @readonly
   */
  readonly logs?: MetricLogDomain[];
}

```

## user.domain.ts

```typescript
/**
 * @file src/types/domain/user.domain.ts
 * @description Defines the domain model interface for a User.
 * This represents the user entity as used within the core business logic,
 * decoupled from database or API specifics. Domain models are often immutable.
 */

/**
 * @interface UserDomain
 * @description Represents a user within the application's core domain logic.
 * Contains essential user information retrieved from the persistence layer.
 */
export interface UserDomain {
  /**
   * @property {string} id - The unique identifier for the user (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} username - The user's unique username.
   * @readonly
   */
  readonly username: string;

  /**
   * @property {string} email - The user's unique email address.
   * @readonly
   */
  readonly email: string;

  /**
   * @property {'user' | 'admin'} role - The assigned role determining user permissions.
   * @readonly
   */
  readonly role: "user" | "admin";

  /**
   * @property {boolean} isPublicProfile - Indicates if the user's profile is publicly visible.
   * @readonly
   */
  readonly isPublicProfile: boolean;

  /**
   * @property {Date} createdAt - The timestamp when the user account was created.
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * @property {Date} updatedAt - The timestamp when the user account was last updated.
   * @readonly
   */
  readonly updatedAt: Date;

  /**
   * @property {Date | null} [deletedAt] - The timestamp when the user account was soft-deleted. Null if active.
   * @readonly
   */
  readonly deletedAt?: Date | null;
}

```

## metric-category.dto.ts

```typescript
// src/types/dtos/metric-category.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
} from "@/types/api/zod-metric-category.schema.js";

/**
 * @file src/types/dtos/metric-category.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricCategory.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface MetricCategoryResponseDTO
 * @description Represents the structure of a MetricCategory object as returned in API responses.
 */
export interface MetricCategoryResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric category (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The user-defined name for the metric category.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string} color - The color code associated with the category for UI display.
   * @readonly
   */
  readonly color: string;

  /**
   * @property {string} icon - The icon identifier associated with the category.
   * @readonly
   */
  readonly icon: string;

  /**
   * @property {string} createdAt - The timestamp when the category was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the category was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;

  /**
   * @property {string | null} [deletedAt] - The timestamp when the category was soft-deleted, formatted as an ISO string. Null if active.
   * @readonly
   */
  readonly deletedAt?: string | null;
}

/**
 * @typedef CreateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric category.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricCategoryRequestDTO = z.infer<
  typeof createMetricCategorySchema.shape.body
>;

/**
 * @typedef UpdateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric category.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricCategoryRequestDTO = z.infer<
  typeof updateMetricCategorySchema.shape.body
>;

```

## metric-log.dto.ts

```typescript
// src/types/dtos/metric-log.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricLogSchema,
  updateMetricLogSchema,
} from "@/types/api/zod-metric-log.schema";

/**
 * @file src/types/dtos/metric-log.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricLog.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface MetricLogResponseDTO
 * @description Represents the structure of a MetricLog object as returned in API responses.
 */
export interface MetricLogResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric log entry (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} metricId - The identifier of the metric this log entry belongs to.
   * @readonly
   */
  readonly metricId: string;

  /**
   * @property {'manual' | 'automatic'} type - Indicates how the log entry was created ('manual' or 'automatic').
   * @readonly
   */
  readonly type: "manual" | "automatic";

  /**
   * @property {number} logValue - The numerical value recorded for the metric in this log entry.
   * @readonly
   */
  readonly logValue: number;

  /**
   * @property {string} loggedAt - The timestamp when the metric value was actually recorded, formatted as an ISO string.
   * @readonly
   */
  readonly loggedAt: string; // ISO string

  /**
   * @property {string} createdAt - The timestamp when the log entry was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the log entry was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}

/**
 * @typedef MetricLogListResponseDTO
 * @description Represents a list (array) of MetricLogResponseDTO objects, typically returned in API responses for collections of metric logs.
 */
export type MetricLogListResponseDTO = MetricLogResponseDTO[];

/**
 * @typedef CreateMetricLogRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric log entry.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricLogRequestDTO = z.infer<
  typeof createMetricLogSchema.shape.body
>;
/**
 * @typedef UpdateMetricLogRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric log entry.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricLogRequestDTO = z.infer<
  typeof updateMetricLogSchema.shape.body
>;

```

## metric-settings.dto.ts

```typescript
// src/types/dtos/metric-settings.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
} from "@/types/api/zod-metric-settings.schema";

/**
 * @file src/types/dtos/metric-settings.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricSettings.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 */

/**
 * @interface DisplayOptionsDTO
 * @description Represents the display options for a metric setting DTO.
 */
export interface DisplayOptionsDTO {
  /**
   * @property {boolean} [showOnDashboard] - Whether the metric should be shown on the dashboard.
   * @readonly
   */
  readonly showOnDashboard?: boolean;
  /**
   * @property {number} [priority] - Display priority (lower number = higher priority).
   * @readonly
   */
  readonly priority?: number;
  /**
   * @property {string} [chartType] - Preferred chart type (e.g., 'line', 'bar').
   * @readonly
   */
  readonly chartType?: string;
  /**
   * @property {string} [color] - Specific color code (e.g., hex).
   * @readonly
   */
  readonly color?: string;
}

/**
 * @interface MetricSettingsResponseDTO
 * @description Represents the structure of a MetricSettings object as returned in API responses.
 */
export interface MetricSettingsResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric settings (typically a UUID).
   * @readonly
   */
  readonly id: string;
  /**
   * @property {string} metricId - The identifier of the metric these settings apply to.
   * @readonly
   */
  readonly metricId: string;
  /**
   * @property {boolean} [isActive] - Flag indicating if these settings are currently active.
   * @readonly
   */
  readonly isActive?: boolean;
  /**
   * @property {boolean} [goalEnabled] - Flag indicating if a goal is set for this metric.
   * @readonly
   */
  readonly goalEnabled?: boolean;
  /**
   * @property {'cumulative' | 'incremental' | null} [goalType] - The type of goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalType?: "cumulative" | "incremental" | null;
  /**
   * @property {number} [goalValue] - The target value for the goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalValue?: number | null;
  /**
   * @property {boolean} [timeFrameEnabled] - Flag indicating if a specific time frame is set for the goal.
   * @readonly
   */
  readonly timeFrameEnabled?: boolean;
  /**
   * @property {string} [startDate] - The start date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly startDate?: string | null;
  /**
   * @property {string} [deadlineDate] - The deadline date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly deadlineDate?: string | null;
  /**
   * @property {boolean} [alertEnabled] - Flag indicating if alerts are enabled for goal progress.
   * @readonly
   */
  readonly alertEnabled?: boolean;
  /**
   * @property {number} [alertThresholds] - The percentage threshold (0-100) for alerts. Null if alerts are disabled.
   * @readonly
   */
  readonly alertThresholds?: number;
  /**
   * @property {boolean} [isAchieved] - Flag indicating if the goal has been achieved.
   * @readonly
   */
  readonly isAchieved?: boolean;
  /**
   * @property {DisplayOptionsDTO} [displayOptions] - Object containing display-related settings.
   * @readonly
   */
  readonly displayOptions?: DisplayOptionsDTO;
  /**
   * @property {string} createdAt - The timestamp when these settings were created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;
  /**
   * @property {string} updatedAt - The timestamp when these settings were last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}

/**
 * @typedef CreateMetricSettingsRequestDTO
 * @description Represents the expected structure of the request body when creating new metric settings.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricSettingsRequestDTO = z.infer<
  typeof createMetricSettingsSchema.shape.body
>;

/**
 * @typedef UpdateMetricSettingsRequestDTO
 * @description Represents the expected structure of the request body when updating existing metric settings.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricSettingsRequestDTO = z.infer<
  typeof updateMetricSettingsSchema.shape.body
>;

```

## metric.dto.ts

```typescript
// src/types/dtos/metric.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricSchema,
  updateMetricSchema,
} from "@/types/api/zod-metric.schema";

// Internal DTOs for associations
import { MetricCategoryResponseDTO } from "./metric-category.dto";
import { MetricSettingsResponseDTO } from "./metric-settings.dto";
import { MetricLogResponseDTO } from "./metric-log.dto";

/**
 * @file src/types/dtos/metric.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for Metric-related API contracts.
 * These interfaces and types are used for incoming and outgoing API requests and responses,
 * defining the structure of data exchanged between the client and server.
 */

/**
 * @interface MetricResponseDTO
 * @description Represents the structure of a Metric object as returned in basic API responses (e.g., after create/update).
 */
export interface MetricResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} userId - The identifier of the user who owns this metric instance.
   * @readonly
   */
  readonly userId: string;

  /**
   * @property {string | null} categoryId - The identifier of the category this metric belongs to, if any. Null if uncategorized.
   * @readonly
   */
  readonly categoryId: string | null;

  /**
   * @property {string | null} originalMetricId - If this metric was created from a public template, this is the ID of the original template metric. Null otherwise.
   * @readonly
   */
  readonly originalMetricId: string | null;

  /**
   * @property {string} name - The user-defined name for the metric.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string | null} description - An optional description providing more details about the metric.
   * @readonly
   */
  readonly description: string | null;

  /**
   * @property {string} defaultUnit - The default unit of measurement for this metric (e.g., 'kg', 'steps', 'ml').
   * @readonly
   */
  readonly defaultUnit: string;

  /**
   * @property {boolean} isPublic - Flag indicating if this metric definition can be publicly discovered or used as a template.
   * @readonly
   */
  readonly isPublic: boolean;

  /**
   * @property {string} createdAt - The timestamp when the metric was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string; // ISO Date string

  /**
   * @property {string} updatedAt - The timestamp when the metric was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string; // ISO Date string
}

/**
 * @interface MetricPreviewCategoryDTO
 * @description Represents summarized category information for a metric preview.
 */
interface MetricPreviewCategoryDTO {
  /**
   * @property {string} id - The unique identifier of the category.
   * @readonly
   */
  readonly id: string;
  /**
   * @property {string} name - The name of the category.
   * @readonly
   */
  readonly name: string;
  /**
   * @property {string} icon - The icon identifier of the category.
   * @readonly
   */
  readonly icon: string;
  /**
   * @property {string} color - The color code of the category.
   * @readonly
   */
  readonly color: string;
}

/**
 * @interface MetricPreviewResponseDTO
 * @description Represents a simplified view of a metric, typically for list displays or previews.
 */
export interface MetricPreviewResponseDTO {
  /**
   * @property {string} id - The unique identifier of the metric.
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} name - The name of the metric.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {MetricPreviewCategoryDTO} [category] - Optional summarized information about the metric's category.
   * @readonly
   */
  readonly category?: MetricPreviewCategoryDTO;

  /**
   * @property {string} [goalType] - Optional goal type associated with the metric's settings (e.g., 'cumulative', 'incremental').
   * @readonly
   */
  readonly goalType?: string;
}

/**
 * @typedef MetricListResponseDTO
 * @description Represents a list (array) of MetricPreviewResponseDTO objects, typically returned in API responses for lists of metrics.
 */
export type MetricListResponseDTO = MetricPreviewResponseDTO[];

/**
 * @interface UserMetricDetailResponseDTO
 * @description Represents a detailed view of a metric, including associated category, settings, and logs.
 */
export interface UserMetricDetailResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} userId - The identifier of the user who owns this metric instance.
   * @readonly
   */
  readonly userId: string;

  /**
   * @property {string | null} categoryId - The identifier of the category this metric belongs to, if any. Null if uncategorized.
   * @readonly
   */
  readonly categoryId: string | null;

  /**
   * @property {string | null} originalMetricId - If this metric was created from a public template, this is the ID of the original template metric. Null otherwise.
   * @readonly
   */
  readonly originalMetricId: string | null;

  /**
   * @property {string} name - The user-defined name for the metric.
   * @readonly
   */
  readonly name: string;

  /**
   * @property {string | null} description - An optional description providing more details about the metric.
   * @readonly
   */
  readonly description: string | null;

  /**
   * @property {string} defaultUnit - The default unit of measurement for this metric (e.g., 'kg', 'steps', 'ml').
   * @readonly
   */
  readonly defaultUnit: string;

  /**
   * @property {boolean} isPublic - Flag indicating if this metric definition can be publicly discovered or used as a template.
   * @readonly
   */
  readonly isPublic: boolean;

  /**
   * @property {string} createdAt - The timestamp when the metric was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string; // ISO Date string

  /**
   * @property {string} updatedAt - The timestamp when the metric was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string; // ISO Date string

  /**
   * @property {MetricCategoryResponseDTO | null} [category] - The associated metric category DTO, if loaded. Null if uncategorized.
   * @readonly
   */
  readonly category?: MetricCategoryResponseDTO | null;

  /**
   * @property {MetricSettingsResponseDTO | null} [settings] - The associated metric settings DTO, if loaded.
   * @readonly
   */
  readonly settings?: MetricSettingsResponseDTO | null;

  /**
   * @property {MetricLogResponseDTO[] | null} [logs] - An array of associated metric log DTOs, if loaded.
   * @readonly
   */
  readonly logs?: MetricLogResponseDTO[] | null;
}

/**
 * @typedef CreateMetricRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricRequestDTO = z.infer<
  typeof createMetricSchema.shape.body
>;

/**
 * @typedef UpdateMetricRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricRequestDTO = z.infer<
  typeof updateMetricSchema.shape.body
>;

```

## user.dto.ts

```typescript
// src/types/dtos/user.dto.ts

/**
 * @file src/types/dtos/user.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for User-related API contracts.
 * These interfaces and types are used for incoming and outgoing API requests and responses,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface UserResponseDTO
 * @description Represents the structure of a User object as returned in API responses (e.g., on login, profile retrieval).
 */
export interface UserResponseDTO {
  /**
   * @property {string} id - The unique identifier for the user (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} username - The user's unique username.
   * @readonly
   */
  readonly username: string;

  /**
   * @property {string} email - The user's unique email address.
   * @readonly
   */
  readonly email: string;

  /**
   *  @property {'user' | 'admin'} role - The role assigned to the user, determining their permissions.
   * @readonly
   */
  readonly role: "user" | "admin";

  /**
   * @property {boolean} isPublicProfile - Indicates if the user's profile is publicly visible.
   * @readonly
   */
  readonly isPublicProfile: boolean;

  /**
   * @property {string} createdAt - The timestamp when the user account was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the user account was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}

```

## request.context.ts

```typescript
// src/types/request.context.ts

import { Request } from "express";
import { UserDomain } from "@/types/domain/user.domain";

/**
 * * Extended Request Interface for Authenticated Routes
 * Ensures all authenticated requests include user information.
 * The user property in AuthRequest is defined as optional (user?: User) because not all routes require authentication
 */
export interface AuthRequest extends Request {
  user?: UserDomain;
}

```

## xss-clean.d.ts

```typescript
declare module "xss-clean" {
  import { RequestHandler } from "express";
  const xssClean: () => RequestHandler;
  export default xssClean;
}

```


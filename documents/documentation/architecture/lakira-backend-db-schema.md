# Backend Database Schema

This document provides a comprehensive overview of the database schema, detailing all tables, their columns, data types, constraints, and relationships.

---

## Enums

### `enum_users_role`
*   **Values**: `user`, `admin`

### `enum_metric_settings_goal_type`
*   **Values**: `cumulative`, `incremental`

### `enum_metric_log_type`
*   **Values**: `manual`, `automatic`

---

## Tables

### `users`

**Description**: Stores user account information.

| Column Name       | Data Type                     | Nullable | Primary Key | Foreign Key | Default Value                               | Unique |
| :---------------- | :---------------------------- | :------- | :---------- | :---------- | :------------------------------------------ | :----- |
| `id`              | `UUID`                        | `No`     | `Yes`       |             | `uuid_generate_v4()`                        |        |
| `username`        | `STRING`                      | `No`     |             |             |                                             | `Yes`  |
| `email`           | `STRING`                      | `No`     |             |             |                                             | `Yes`  |
| `password`        | `STRING`                      | `No`     |             |             |                                             |        |
| `role`            | `ENUM('user', 'admin')`       | `No`     |             |             | `user`                                      |        |
| `is_public_profile` | `BOOLEAN`                     | `No`     |             |             | `true`                                      |        |
| `created_at`      | `DATE`                        | `No`     |             |             | `NOW()`                                     |        |
| `updated_at`      | `DATE`                        | `No`     |             |             | `NOW()`                                     |        |
| `deleted_at`      | `DATE`                        | `Yes`    |             |             |                                             |        |

---

### `metric_categories`

**Description**: Stores categories for metrics, allowing users to organize their metrics.

| Column Name | Data Type | Nullable | Primary Key | Foreign Key           | Default Value      | Unique |
| :---------- | :-------- | :------- | :---------- | :-------------------- | :----------------- | :----- |
| `id`        | `UUID`    | `No`     | `Yes`       |                       | `uuid_generate_v4()` |        |
| `user_id`   | `UUID`    | `No`     |             | `users(id)` (CASCADE) |                    |        |
| `name`      | `STRING`  | `No`     |             |                       |                    |        |
| `color`     | `STRING`  | `No`     |             |                       | `#E897A3`          |        |
| `icon`      | `STRING`  | `No`     |             |                       | `📁`               |        |
| `created_at`| `DATE`    | `No`     |             |                       | `NOW()`            |        |
| `updated_at`| `DATE`    | `No`     |             |                       | `NOW()`            |        |
| `deleted_at`| `DATE`    | `Yes`    |             |                       |                    |        |

---

### `metrics`

**Description**: Stores definitions for various metrics tracked by users.

| Column Name        | Data Type | Nullable | Primary Key | Foreign Key                     | Default Value      | Unique |
| :----------------- | :-------- | :------- | :---------- | :------------------------------ | :----------------- | :----- |
| `id`               | `UUID`    | `No`     | `Yes`       |                                 | `uuid_generate_v4()` |        |
| `user_id`          | `UUID`    | `No`     |             | `users(id)` (CASCADE)           |                    |        |
| `category_id`      | `UUID`    | `Yes`    |             | `metric_categories(id)` (SET NULL) |                    |        |
| `original_metric_id` | `UUID`    | `Yes`    |             | `metrics(id)` (SET NULL)        |                    |        |
| `name`             | `STRING`  | `No`     |             |                                 |                    |        |
| `description`      | `STRING`  | `Yes`    |             |                                 |                    |        |
| `default_unit`     | `STRING`  | `No`     |             |                                 |                    |        |
| `is_public`        | `BOOLEAN` | `No`     |             |                                 | `true`             |        |
| `created_at`       | `DATE`    | `No`     |             |                                 | `NOW()`            |        |
| `updated_at`       | `DATE`    | `No`     |             |                                 | `NOW()`            |        |
| `deleted_at`       | `DATE`    | `Yes`    |             |                                 |                    |        |

---

### `metric_settings`

**Description**: Stores user-specific settings and goals for each metric.

| Column Name        | Data Type                         | Nullable | Primary Key | Foreign Key           | Default Value                                                                  | Unique |
| :----------------- | :-------------------------------- | :------- | :---------- | :-------------------- | :----------------------------------------------------------------------------- | :----- |
| `id`               | `UUID`                            | `No`     | `Yes`       |                       | `uuid_generate_v4()`                                                           |        |
| `metric_id`        | `UUID`                            | `No`     |             | `metrics(id)` (CASCADE) |                                                                                |        |
| `goal_enabled`     | `BOOLEAN`                         | `No`     |             |                       | `false`                                                                        |        |
| `goal_type`        | `ENUM('cumulative', 'incremental')` | `Yes`    |             |                       |                                                                                |        |
| `goal_value`       | `FLOAT`                           | `Yes`    |             |                       |                                                                                |        |
| `time_frame_enabled` | `BOOLEAN`                         | `No`     |             |                       | `false`                                                                        |        |
| `start_date`       | `DATEONLY`                        | `Yes`    |             |                       |                                                                                |        |
| `deadline_date`    | `DATEONLY`                        | `Yes`    |             |                       |                                                                                |        |
| `alert_enabled`    | `BOOLEAN`                         | `No`     |             |                       | `false`                                                                        |        |
| `alert_thresholds` | `INTEGER`                         | `Yes`    |             |                       | `80`                                                                           |        |
| `is_achieved`      | `BOOLEAN`                         | `No`     |             |                       | `false`                                                                        |        |
| `is_active`        | `BOOLEAN`                         | `No`     |             |                       | `true`                                                                         |        |
| `display_options`  | `JSONB`                           | `No`     |             |                       | `'{"showOnDashboard": true, "priority": 1, "chartType": "line", "color": "#E897A3"}'::jsonb` |        |
| `created_at`       | `DATE`                            | `No`     |             |                       | `NOW()`                                                                        |        |
| `updated_at`       | `DATE`                            | `No`     |             |                       | `NOW()`                                                                        |        |

---

### `metric_logs`

**Description**: Records individual log entries for metrics.

| Column Name | Data Type                     | Nullable | Primary Key | Foreign Key           | Default Value      | Unique |
| :---------- | :---------------------------- | :------- | :---------- | :-------------------- | :----------------- | :----- |
| `id`        | `UUID`                        | `No`     | `Yes`       |                       | `uuid_generate_v4()` |        |
| `metric_id` | `UUID`                        | `No`     |             | `metrics(id)` (CASCADE) |                    |        |
| `log_value` | `FLOAT`                       | `No`     |             |                       |                    |        |
| `type`      | `ENUM('manual', 'automatic')` | `No`     |             |                       | `manual`           |        |
| `logged_at` | `DATE`                        | `No`     |             |                       | `NOW()`            |        |
| `created_at`| `DATE`                        | `No`     |             |                       | `NOW()`            |        |
| `updated_at`| `DATE`                        | `No`     |             |                       | `NOW()`            |        |
# Lakira Product Requirements Document

## 1. Introduction
### 1.1. Purpose of the Document
This document outlines the requirements for the Lakira application, a goal-tracking web application. It serves as a guide for the development team and stakeholders, ensuring a shared understanding of the project's goals, features, and functionality.
### 1.2. Scope of the Project
This project encompasses the development of a backend API using Node.js, Express.js, PostgreSQL, and D3.js. It includes user authentication, metric tracking, data visualization, and API endpoints for managing users, metrics, categories, and logs.
### 1.3. Target Audience
The target audience for Lakira includes individuals who want to track and improve their progress in various areas of life, such as fitness, wellness, productivity, learning, or personal habits.

## 2. Goals and Objectives
### 2.1. Business Goals:
* Increase user engagement and retention by 20% within the first quarter of launch.
* Provide a valuable tool for personal growth and self-improvement, as measured by a 4.5-star average user rating.
* Establish Lakira as a leading goal-tracking application, achieving a top 3 ranking in relevant app store categories within the first year.
### 2.2. User Goals:
* Easily track progress towards personal goals with an intuitive and user-friendly interface.
* Visualize data to identify trends and patterns, enabling data-driven decision-making.
* Stay motivated and accountable through reminders and progress summaries, leading to increased goal achievement rates.
* Customize the application to fit individual needs and preferences, ensuring a personalized and engaging experience.
### 2.3. Technical Goals:
* Develop a scalable and reliable backend API capable of handling 10,000 concurrent users with sub-second response times.
* Ensure data security and privacy, complying with industry best practices and relevant regulations.
* Implement a responsive and user-friendly interface that is accessible across a range of devices and screen sizes.
* Maintain a clean and well-documented codebase, adhering to coding standards and best practices.

## 3. Background and Strategy
### 3.1. Problem Statement:
Many individuals struggle to consistently track their progress towards personal goals, leading to decreased motivation and a lack of accountability. Existing goal-tracking solutions may be too complex, lack customization options, or fail to provide meaningful insights.
### 3.2. Proposed Solution:
Lakira provides a simple and intuitive platform for users to track their progress towards any type of goal. By offering customizable metrics, data visualization, and smart reminders, Lakira empowers users to stay motivated, accountable, and informed.
### 3.3. Competitive Analysis: (To be completed based on market research. Competitors include apps like Strides, Habitica, and Coach.me. Lakira will differentiate itself through its minimalist design inspired by Japanese and Javanese aesthetics, its focus on data visualization, and its customizable metric system.)

## 4. Product Description
### 4.1. Product Overview:
Lakira is a versatile tracking app designed to help users monitor, visualize, and improve their progress in fitness, wellness, productivity, learning, or personal habits. It allows users to track custom metrics, visualize trends with interactive charts, set goal-oriented milestones, and receive smart reminders. The application is designed with a minimalist aesthetic inspired by Japanese and Javanese design principles.
### 4.2. Key Features:
* Custom Metrics: Track anything, from gym workouts and study hours to sleep quality and mindfulness sessions.
* Visual Analytics: Interactive charts & insights for tracking trends.
* Goal-Oriented Tracking: Set milestones, measure improvements.
* Minimalist Design: Inspired by Japanese precision and structured simplicity and Javanese calming and elegant.
* Smart Reminders: Stay accountable with nudges and progress summaries.

## 5. Features
### 5.1. User Authentication
#### 5.1.1. Description:
The application will provide secure user authentication using email and password. Users will be able to register a new account, log in to an existing account, and manage their profile information. Password hashing with bcrypt will be used to protect user credentials. JWT-based authentication will be used for protected routes.
#### 5.1.2. User Stories:
* As a new user, I want to be able to register an account with my email and password so that I can access the application.
* As an existing user, I want to be able to log in to my account with my email and password so that I can track my goals.
* As a logged-in user, I want to be able to update my profile information so that I can keep my account up-to-date.
* As a logged-in user, I want to be able to log out of my account so that I can protect my privacy.
#### 5.1.3. Acceptance Criteria:
* Users can register with a valid email address and a password that meets complexity requirements (e.g., minimum 8 characters, including one uppercase letter, one lowercase letter, and one number).
* Users can log in with their registered email and password within 2 seconds.
* Users can update their profile information, including email and password, with changes reflected immediately.
* The system securely stores user passwords using bcrypt hashing with a salt factor of 10.
* Protected routes require a valid JWT for access, with a token expiration time of 1 hour.
### 5.2. Dashboard
#### 5.2.1. Description:
The dashboard will provide users with an overview of their key metrics and progress towards their goals. It will display metrics where `showOnDashboard === true`. Charts will show trends over time using D3.js for each Metric.
#### 5.2.2. User Stories:
* As a logged-in user, I want to see a summary of my most important metrics on the dashboard so that I can quickly assess my progress.
* As a logged-in user, I want to be able to customize which metrics are displayed on the dashboard so that I can focus on what's most important to me.
* As a logged-in user, I want to see charts visualizing my progress over time so that I can identify trends and patterns.
#### 5.2.3. Acceptance Criteria:
* The dashboard displays a summary of the user's key metrics, with a maximum of 10 metrics displayed at a time.
* Users can customize which metrics are displayed on the dashboard through a drag-and-drop interface.
* Charts are displayed for each metric, visualizing progress over time with a selectable time range (e.g., 7 days, 30 days, 90 days).
* The dashboard is responsive and adapts to different screen sizes, ensuring optimal viewing on desktop, tablet, and mobile devices.
### 5.3. Libraries of Metric and Metric Category
#### 5.3.1. Description:
The application will allow users to create and manage libraries of metrics and metric categories. Users will be able to create new metrics and categories, view existing metrics and categories, update metrics and categories, and delete metrics and categories.
#### 5.3.2. User Stories:
* As a logged-in user, I want to be able to create new metric categories so that I can organize my metrics.
* As a logged-in user, I want to be able to create new metrics so that I can track my progress towards specific goals.
* As a logged-in user, I want to be able to view a list of all my metrics and categories so that I can easily find what I'm looking for.
* As a logged-in user, I want to be able to update my metrics and categories so that I can keep them up-to-date.
* As a logged-in user, I want to be able to delete metrics and categories that I no longer need so that I can keep my account organized.
#### 5.3.3. Acceptance Criteria:
* Users can create new metric categories with a name (maximum 50 characters), color (using a color picker), and icon (using an emoji selector).
* Users can create new metrics with a name (maximum 50 characters), description (maximum 200 characters), and default unit (e.g., steps, hours, minutes).
* Users can view a list of all their metrics and categories, with pagination to handle large libraries.
* Users can update the name, description, color, and icon of their metric categories.
* Users can update the name, description, and default unit of their metrics.
* Users can delete metric categories and metrics, with a confirmation prompt to prevent accidental deletion.
### 5.4. Logging Metrics
#### 5.4.1. Description:
The application will allow users to log metrics. Users will be able to log metrics manually through forms. Input validation and error handling will be implemented to ensure data quality.
#### 5.4.2. User Stories:
* As a logged-in user, I want to be able to log my metrics manually so that I can track my progress.
* As a logged-in user, I want the application to validate my input when logging metrics so that I can ensure data quality.
* As a logged-in user, I want to receive helpful error messages if I enter invalid data so that I can correct my mistakes.
#### 5.4.3. Acceptance Criteria:
* Users can log metrics manually through forms, with appropriate input fields for different data types (e.g., number, text, date).
* The application validates user input to ensure data quality, including range checks, format validation, and required fields.
* Helpful error messages are displayed if the user enters invalid data, providing clear instructions on how to correct the mistakes.
* The application supports logging different types of data (e.g., numbers, text, dates), with appropriate data validation and storage for each type.
### 5.5. Metric Settings
#### 5.5.1. Description:
The application will allow users to set, update, and delete personal goals through MetricSettings. Users can access historical goals.
#### 5.5.2. User Stories:
* As a logged-in user, I want to be able to set a goal for a metric so that I can track my progress towards a specific target.
* As a logged-in user, I want to be able to update the goal for a metric so that I can adjust my target as needed.
* As a logged-in user, I want to be able to delete a goal for a metric so that I can remove it if it's no longer relevant.
* As a logged-in user, I want to be able to view my historical goals so that I can see how my targets have changed over time.
#### 5.5.3. Acceptance Criteria:
* Users can set a goal for a metric, including the goal type (cumulative or incremental), goal value (with appropriate unit), time frame (start date and deadline date), and alert thresholds (as a percentage of the goal value).
* Users can update the goal for a metric, including the goal type, goal value, time frame, and alert thresholds.
* Users can delete a goal for a metric, with a confirmation prompt to prevent accidental deletion.
* Users can view their historical goals for a metric, with the ability to filter by date range.
### 5.6. Public Profile
#### 5.6.1. Description:
The application will allow users to control the visibility of their profile to other users. The `isPublicProfile` field in the User model determines whether a user's profile is visible to other users.
#### 5.6.2. User Stories:
* As a logged-in user, I want to be able to make my profile public so that other users can see my progress and achievements.
* As a logged-in user, I want to be able to make my profile private so that my data is not visible to other users.
#### 5.6.3. Acceptance Criteria:
* Users can set their profile to public or private through a toggle switch in their profile settings.
* When a user's profile is public, other users can view their profile information, including their username, metrics, and progress.
* When a user's profile is private, other users cannot view their profile information.
### 5.7. Metric Adoption
#### 5.7.1. Description:
The application will allow users to copy and customize metrics created by other users, creating a library of reusable metrics. The `originalMetricId` field in the Metric model references the original metric if the metric was adopted from another user.
#### 5.7.2. User Stories:
* As a logged-in user, I want to be able to browse a library of metrics created by other users so that I can find metrics that are relevant to my goals.
* As a logged-in user, I want to be able to copy and customize a metric created by another user so that I can adapt it to my specific needs.
#### 5.7.3. Acceptance Criteria:
* Users can browse a library of metrics created by other users, with the ability to filter by category and search by keyword.
* Users can copy a metric created by another user and customize it, including changing the name, description, unit, and goal settings.
* The system tracks the origin of adopted metrics using the `originalMetricId` field, providing attribution to the original creator.

## 6. UI/UX Design
### 6.1. Overall Design Principles (Minimalist, Japanese and Javanese aesthetics):
The UI/UX design will incorporate both Japanese and Javanese elements, with a focus on creating a harmonious and balanced design. This will involve using a combination of traditional patterns, colors, and typography from both cultures. The UI should use a light color palette with subtle accents, clean typography, and ample whitespace to create a sense of calm and clarity. Javanese elements could be incorporated through subtle patterns or textures. The UI should prioritize functionality and ease of use, with a focus on clear data visualization and intuitive navigation. Japanese elements could be incorporated through the use of grid-based layouts and minimalist icons.
### 6.2. User Interface Mockups (if available): (To be completed with UI/UX designer. Mockups will include wireframes and visual designs for key screens, such as the dashboard, metric library, and logging form.)
### 6.3. User Flows: (To be completed with UI/UX designer. User flows will outline the steps users take to complete key tasks, such as registering an account, logging a metric, and setting a goal.)
### 6.4. Accessibility Considerations:
The application will be designed to be accessible to users with disabilities, following WCAG guidelines. This includes providing alternative text for images, ensuring sufficient color contrast (a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text), and providing keyboard navigation.

## 7. Technical Architecture
### 7.1. System Diagram: (To be completed with a system architect. The system diagram will illustrate the key components of the application, including the backend API, database, and frontend client.)
### 7.2. Technology Stack:
* Backend: Node.js, Express.js
* Database: PostgreSQL
* Data Visualization: D3.js
* Authentication: JWT (JSON Web Tokens)
* ORM: Sequelize
### 7.3. API Endpoints: (See legacy PRD for detailed API specifications)
* Authentication Endpoints:
 * `POST /api/v1/auth/register`: Register a new user
 * `POST /api/v1/auth/login`: Login user and return JWT
 * `GET /api/v1/auth/profile`: Get authenticated user's profile
 * `PUT /api/v1/auth/profile`: Update authenticated user's profile
 * `POST /api/v1/auth/logout`: Logout user
* Metrics Endpoints:
 * `GET /api/v1/metrics`: Get all metrics for authenticated user (with pagination, filtering)
 * `GET /api/v1/metrics/:id`: Get a specific metric
 * `POST /api/v1/metrics`: Add a new metric
 * `PUT /api/v1/metrics/:id`: Update a metric
 * `DELETE /api/v1/metrics/:id`: Delete a metric
* MetricSettings Endpoints:
 * `GET /api/v1/metrics/:metricId/settings`: Get all settings for a specific metric
 * `POST /api/v1/metrics/:metricId/settings`: Add new settings to a metric
 * `PATCH /api/v1/metrics/:metricId/settings/:id`: Update a metric setting
 * `DELETE /api/v1/metrics/:metricId/settings/:id`: Delete a metric setting
* MetricCategory Endpoints:
 * `GET /api/v1/categories`: Get all metric categories for authenticated user
 * `GET /api/v1/categories/:id`: Get a specific category
 * `POST /api/v1/categories`: Add a new metric category
 * `PUT /api/v1/categories/:id`: Update a metric category
 * `DELETE /api/v1/categories/:id`: Delete a metric category
* MetricLog Endpoints:
 * `GET /api/v1/metrics/:metricId/logs`: Get all logs for a specific metric
 * `GET /api/v1/metrics/:metricId/logs/:id`: Get a specific log entry
 * `POST /api/v1/metrics/:metricId/logs`: Add a new metric log
 * `PUT /api/v1/metrics/:metricId/logs/:id`: Update a metric log
 * `DELETE /api/v1/metrics/:metricId/logs/:id`: Delete a metric log
* Trends Endpoints:
 * `GET /api/v1/metrics/:metricId/trends`: Get trend data for a specific metric
### 7.4. Database Schema: (See legacy PRD for detailed database schema)
* User:
 * `id`: UUID, required, unique
 * `username`: String, required, unique
 * `email`: String, required, unique, validate: { isEmail: true }
 * `password`: String, required
 * `role`: ENUM("user", "admin") default "user"
 * `isPublicProfile`:  Bool, required, default ‘true’
 * `createdAt`: Date
 * `updatedAt`: Date
 * `deletedAt`: Date
* Metric:
 * `id`: UUID
 * `userId`: UUID, references User (cascade, can’t exist without User)
 * `categoryId`: UUID, reference MetricCategory (nullify, do exists without MetricCategory)
 * `originalMetricId`: UUID, reference Metric (adopted from other user, nullify do exist if adopted Metric is deleted)
 * `name`: String (e.g., 'steps', 'hydration')
 * `description`: String
 * `defaultUnit`: String
 * `isPublic`: Boolean (default ‘true’)
 * `createdAt`: Date
 * `updatedAt`: Date
 * `deletedAt`: Date
* MetricSettings:
 * `id`: UUID
 * `metricId`: UUID, references Metric (cascade, can’t exists without Metric)
 * `goalEnabled`: Boolean (default ‘false’)
 * `goalType`: ENUM("cumulative", "incremental")
 * `goalValue`: Number
 * `timeFrameEnabled`: Boolean (default ‘false’)
 * `startDate`: Date
 * `deadlineDate`: Date
 * `alertEnabled`: Boolean (default ‘false’)
 * `alertThresholds`: Number (default 80)
 * `isAchieved`: Boolean (default ‘false’)
 * `isActive`: Boolean (default ‘true’)
 * `displayOptions`: JSONB (default { showOnDashboard: true, priority: 1, chartType: "line", color: "#E897A3" })
 * `createdAt`: Date
 * `updatedAt`: Date
* MetricLog:
 * `id`: UUID
 * `metricId`: UUID, references Metric (cascade, can’t exists without Metric)
 * `type`: ENUM("manual", "automatic") default "manual"
 * `logValue`: Number
 * `loggedAt`: Date
 * `createdAt`: Date
 * `updatedAt`: Date
* MetricCategory:
 * `id`: UUID
 * `userId`: UUID, references User (cascade, can’t exists without User)
 * `name`: String, required
 * `color`: String (hex, default to ‘E897A3’)
 * `icon`: String (emoji, default to '📁')
 * `deletedAt`: Date
 * `createdAt`: Date
 * `updatedAt`: Date

## 8. Performance Requirements
### 8.1. Response Times:
API endpoints should respond within 200ms on average, with a 95th percentile response time of under 500ms.
### 8.2. Scalability:
The system should be able to handle a large number of concurrent users and metrics without performance degradation, supporting at least 10,000 concurrent users and 1 million metrics.
### 8.3. Resource Utilization:
The system should be optimized to minimize resource utilization (CPU, memory, disk I/O), with CPU utilization under 70% and memory utilization under 80% during peak load.

## 9. Security Considerations
### 9.1. Authentication and Authorization
* Implement JWT-based authentication to protect API endpoints.
* Use bcrypt for password hashing with a salt factor of 10.
* Implement role-based access control (RBAC) to restrict access to sensitive data and functionality.
### 9.2. Data Security
* Encrypt sensitive data at rest and in transit using industry-standard encryption algorithms (e.g., AES-256).
* Implement regular security audits and penetration testing to identify and address vulnerabilities.
* Protect against common web vulnerabilities, such as SQL injection, cross-site scripting (XSS), and cross-site request forgery (CSRF).
### 9.3. Vulnerability Management
* Establish a vulnerability management process to identify, assess, and remediate vulnerabilities in a timely manner.
* Use a vulnerability scanner to regularly scan the application for known vulnerabilities.
* Subscribe to security mailing lists and monitor security advisories to stay informed about new vulnerabilities.

## 10. Legal and Compliance Considerations
### 10.1. GDPR Compliance
* Implement mechanisms to obtain user consent for data collection and processing.
* Provide users with the ability to access, rectify, and erase their personal data.
* Implement data anonymization and pseudonymization techniques to protect user privacy.
### 10.2. Data Privacy
* Develop a comprehensive data privacy policy that outlines how user data is collected, used, and protected.
* Obtain user consent for data sharing with third parties.
* Implement data retention policies to ensure that user data is not stored for longer than necessary.
### 10.3. Terms of Service
* Develop clear and concise terms of service that outline the rights and responsibilities of users and the application provider.
* Obtain user agreement to the terms of service before allowing them to use the application.
* Regularly review and update the terms of service to ensure that they are compliant with applicable laws and regulations.

## 11. Deployment Strategy
### 11.1. Environment Setup (Private self-hosted VPS)
* Provision a virtual private server (VPS) with sufficient resources (CPU, memory, disk space) to support the application.
* Install and configure the necessary software, including Node.js, PostgreSQL, and Nginx.
* Configure a firewall to restrict access to the VPS.
### 11.2. Deployment Process
* Use a continuous integration and continuous deployment (CI/CD) pipeline to automate the deployment process.
* Deploy the application to the VPS using a tool such as Docker or Ansible.
* Monitor the application after deployment to ensure that it is running correctly.
### 11.3. Monitoring and Maintenance
* Implement a monitoring system to track the application's performance and identify potential issues.
* Implement a backup and recovery plan to protect against data loss.
* Regularly update the application and its dependencies to address security vulnerabilities and improve performance.

## 12. Testing and Quality Assurance
### 12.1. Testing Strategy
* Implement a comprehensive testing strategy that includes unit tests, integration tests, and end-to-end tests.
* Use a test-driven development (TDD) approach to ensure that tests are written before code.
* Automate the testing process to ensure that tests are run regularly.
### 12.2. Test Cases
* Develop detailed test cases for each feature of the application, covering both positive and negative scenarios.
* Use a test case management tool to track the status of test cases.
* Ensure that test cases are reviewed and approved by stakeholders.
### 12.3. Bug Reporting and Tracking
* Implement a bug reporting and tracking system to manage bug reports.
* Use a bug tracking tool to track the status of bug reports.
* Ensure that bug reports are prioritized and resolved in a timely manner.

## 13. Success Metrics
### 13.1. Key Performance Indicators (KPIs)
* User engagement: Daily active users (DAU), monthly active users (MAU), session duration, feature usage.
* User retention: Churn rate, retention rate, customer lifetime value (CLTV).
* Performance: API response time, error rate, resource utilization.
* Goal achievement: Percentage of users achieving their goals, average time to goal achievement.
### 13.2. Data Collection and Analysis
* Use a data analytics platform to collect and analyze user data.
* Track key performance indicators (KPIs) to measure the success of the application.
* Use data insights to identify areas for improvement and inform product development decisions.

## 14. Future Roadmap
### 14.1. Planned Enhancements
* Implement support for automatic metric logging through integrations with third-party apps and devices.
* Add support for social sharing of progress and achievements.
* Develop a mobile app for iOS and Android.
### 14.2. Potential New Features
* Implement gamification elements to further incentivize user engagement.
* Add support for team-based goal tracking and collaboration.
* Develop a personalized coaching feature to provide users with tailored guidance and support.
### 14.3. Scalability Plans
* Migrate the database to a cloud-based service to improve scalability and reliability.
* Implement a caching layer to reduce database load and improve response times.
* Use a content delivery network (CDN) to distribute static assets and improve performance for users around the world.
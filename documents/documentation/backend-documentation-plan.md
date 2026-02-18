# Backend Documentation Plan

1.  **Create a Markdown file:** The documentation will be written in Markdown format.
2.  **Add a Table of Contents:** The file will start with a table of contents, linking to each data type, API endpoint, database table, caching strategy, error handling, authentication, and authorization.
3.  **Document each data type:** For each data type, I will include:
    - A description of the data type
    - A table of fields, including:
      - Name
      - Type
      - Description
      - Nullable
      - Default Value (if applicable)
      - Validation Rules
      - Error Messages
    - An example of the data type in JSON format
    - Data Mapping Information:
      - Input Data Type
      - Output Data Type
      - Mapping Description

4.  **Document enums:** For each enum, I will include:
    - A description of the enum
    - A list of possible values

5.  **Document each API endpoint:** For each API endpoint, I will include:
    - The URL
    - The HTTP method
    - The request body (if applicable), including the data type
    - The response body, including the data type
    - Authentication and Authorization requirements

6.  **Document each database table:** For each table in the database, I will include:
    - The table name
    - A description of the table
    - A table of columns, including:
      - Name
      - Type
      - Description
      - Nullable
      - Default Value (if applicable)
      - Primary Key
      - Foreign Key

7.  **Document the Caching Strategy:** I will include a section describing the caching strategy used in the backend, including:
    - The caching mechanism (e.g., Redis)
    - The cache keys
    - The cache expiration times

8.  **Document the Error Handling:** I will include a section describing the error handling used in the backend, including:
    - The error codes
    - The error messages
    - The error handling middleware

9.  **Document Authentication and Authorization:** I will include a section describing the authentication and authorization mechanisms used in the backend, including:
    - The authentication method (e.g., JWT)
    - The roles and permissions
    - The authentication middleware

10. **Organize the documentation:** I will organize the documentation by category (e.g., API, DB, Domain, DTO).
11. **Shared Middleware Reference:** Link to `documents/development/architecture/feature-vertical-slice-migration/references/shared-middleware.md` so engineers know where cross-cutting middleware (auth guards, rate limiters, validation, cache, error handling) lives.

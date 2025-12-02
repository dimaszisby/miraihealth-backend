-- Create the development database
CREATE DATABASE IF NOT EXISTS lakira_development;

-- Create the test database
CREATE DATABASE IF NOT EXISTS lakira_test_db;

-- Grant all privileges on the development database to lakira_user
GRANT ALL PRIVILEGES ON DATABASE lakira_development TO lakira_user;

-- Grant all privileges on the test database to lakira_user
GRANT ALL PRIVILEGES ON DATABASE lakira_test_db TO lakira_user;
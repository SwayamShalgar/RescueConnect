-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    adminid VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt - $2b$10$)
INSERT INTO admins (adminid, password, name, email) 
VALUES (
    'admin',
    '$2b$10$YQmJZ9Z5Z5Z5Z5Z5Z5Z5ZuK9X9X9X9X9X9X9X9X9X9X9X9X9X9X9X',
    'System Administrator',
    'admin@rescueconnect.com'
);

-- Note: You should hash the password properly using bcrypt
-- The above is a placeholder. Use this to generate a proper hash:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('admin123', 10);

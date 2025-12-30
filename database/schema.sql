-- SunoApp Database Schema
-- Database name: sunoapp_db

-- Create database
CREATE DATABASE IF NOT EXISTS sunoapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sunoapp_db;

-- Users table for authentication and team collaboration
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Styles table for music style management
CREATE TABLE styles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    genre TEXT,
    beat TEXT,
    mood TEXT,
    vocals TEXT,
    instrumentation TEXT,
    style_description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Songs table for song management
CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('create', 'submitted', 'completed', 'unspecified') DEFAULT 'create',
    specific_title VARCHAR(500),
    specific_lyrics TEXT,
    prompt_to_generate TEXT,
    style_id INT,
    vocal_gender ENUM('male', 'female', 'other'),
    download_url_1 VARCHAR(1000),
    download_url_2 VARCHAR(1000),
    suno_task_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_style_id (style_id),
    INDEX idx_suno_task_id (suno_task_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@aiacopilot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIBx.aXZrC');

-- Insert sample style based on your Excel data
INSERT INTO styles (name, genre, beat, mood, vocals, instrumentation, style_description, created_by) VALUES
(
    'Matt Dubb x TRON Hybrid',
    'EDM pop with Jewish dance influence and futuristic TRON-style synthwave elements',
    'upbeat festival rhythm with punchy 4-on-the-floor kick and digital percussion',
    'energetic, inspiring, heroic, neon futuristic',
    'melodic male pop vocal with a catchy, simple, sing-along chorus',
    'bright supersaws, neon plucks, glassy arps, deep cyber bass, shimmering pads, and cinematic TRON-like build-ups and drops',
    'modern Matt Dubb dance sound blended with futuristic synthwave and digital TRON energy',
    1
);

-- Create view for song details with related data
CREATE VIEW song_details_view AS
SELECT
    s.id,
    s.specific_title,
    s.specific_lyrics,
    s.prompt_to_generate,
    s.status,
    s.vocal_gender,
    s.download_url_1,
    s.download_url_2,
    s.suno_task_id,
    s.created_at,
    s.updated_at,
    u.username as creator_username,
    u.email as creator_email,
    st.name as style_name,
    st.genre,
    st.beat,
    st.mood,
    st.vocals,
    st.instrumentation,
    st.style_description
FROM songs s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN styles st ON s.style_id = st.id;

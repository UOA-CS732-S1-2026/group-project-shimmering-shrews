-- ⚠️ DEV ONLY: Reset database
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE challenge_status AS ENUM ('in_progress', 'accepted', 'skipped', 'completed');

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth_id VARCHAR(500) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(250) UNIQUE NOT NULL,
    user_role user_role NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_completed_challenge TIMESTAMPTZ,

    level INTEGER NOT NULL DEFAULT 1,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    streak_count INTEGER NOT NULL DEFAULT 0
);

-- BADGES
CREATE TABLE badge (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    achievement_criteria JSONB NOT NULL,
    target_value INTEGER NOT NULL,
    description VARCHAR(100),
    active_url VARCHAR(500),
    inactive_url VARCHAR(500)
);

-- LOCATION
CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(250),
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL
);

-- CHALLENGE CATEGORY
CREATE TABLE challenge_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(500)
);

-- CHALLENGE
CREATE TABLE challenge (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    location_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    xp_worth INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description VARCHAR(1000),

    CONSTRAINT fk_challenge_location
        FOREIGN KEY (location_id)
        REFERENCES location(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_challenge_category
        FOREIGN KEY (category_id)
        REFERENCES challenge_category(id)
        ON DELETE CASCADE
);

-- AWARDED BADGES
CREATE TABLE awarded_badge (
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY(user_id, badge_id),

    CONSTRAINT fk_ab_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ab_badge
        FOREIGN KEY (badge_id)
        REFERENCES badge(id)
        ON DELETE CASCADE
);

-- USER BADGE PROGRESS
CREATE TABLE user_badge_progress (
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    current_value INTEGER NOT NULL,

    PRIMARY KEY(user_id, badge_id),

    CONSTRAINT fk_ubp_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ubp_badge
        FOREIGN KEY (badge_id)
        REFERENCES badge(id)
        ON DELETE CASCADE
);

CREATE TABLE user_stat (
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (user_id, category_id),

    CONSTRAINT fk_us_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_us_category
        FOREIGN KEY (category_id)
        REFERENCES challenge_category(id)
        ON DELETE CASCADE,
);

-- USER CHALLENGE
CREATE TABLE user_challenge (
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    status challenge_status NOT NULL,
    xp_worth INTEGER NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,

    PRIMARY KEY(user_id, challenge_id),

    CONSTRAINT fk_uc_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uc_challenge
        FOREIGN KEY (challenge_id)
        REFERENCES challenge(id)
        ON DELETE CASCADE
);

/* Speed up querying users on auth id */
CREATE INDEX idx_users_auth_id ON users(auth_id);

/* No user can have more than one stat record for a single category,
   but they can if the category is null
*/
CREATE UNIQUE INDEX user_category_unique
ON user_stat (user_id, category_id)
WHERE category_id IS NOT NULL;

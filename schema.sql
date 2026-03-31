-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE challenge_status AS ENUM ('in_progress', 'completed');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(250) NOT NULL,
    surname VARCHAR(250) NOT NULL,
    email VARCHAR(250) UNIQUE NOT NULL,
    user_role user_role NOT NULL,
    -- updated whenever user completes a challenge
    last_completed_challenge TIMESTAMP,
    -- computed fields
    level INTEGER NOT NULL DEFAULT 1,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    streak_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE badge (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    -- achievement_criteria defines what triggers a badge's progress to update
    achievement_criteria JSONB NOT NULL,
    description VARCHAR(100),
    -- What the badge looks like achieved vs unachieved
    active_url VARCHAR(500),
    inactive_url VARCHAR(500)
);

CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    located_at GEOGRAPHY(Point, 4326) NOT NULL,
    name VARCHAR(500),
    category VARCHAR(250)
);

CREATE TABLE challenge (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    location_id INTEGER NOT NULL,
    xp_worth INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(1000),
    duration INTERVAL,
    started_at TIMESTAMP,

    CONSTRAINT fk_challenge_location
        FOREIGN KEY (location_id)
        REFERENCES location(id)
        ON DELETE CASCADE
);


CREATE TABLE activity_log (
    user_id INTEGER NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    description JSON NOT NULL,

    PRIMARY KEY (user_id, recorded_at),

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE awarded_badge (
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,

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

CREATE TABLE user_challenge (
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    status challenge_status NOT NULL,
    xp_worth INTEGER NOT NULL,
    assigned_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,

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
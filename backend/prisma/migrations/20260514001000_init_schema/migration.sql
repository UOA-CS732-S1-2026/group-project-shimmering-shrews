CREATE TYPE "user_role" AS ENUM ('user', 'admin');

CREATE TYPE "challenge_status" AS ENUM (
  'in_progress',
  'accepted',
  'cancelled',
  'skipped',
  'completed',
  'expired'
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(100) NOT NULL UNIQUE,
  "email" VARCHAR(250) NOT NULL UNIQUE,
  "user_role" "user_role" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_completed_challenge" TIMESTAMPTZ(6),
  "level" INTEGER NOT NULL DEFAULT 1,
  "xp_earned" INTEGER NOT NULL DEFAULT 0,
  "streak_count" INTEGER NOT NULL DEFAULT 0,
  "auth_id" VARCHAR(500) NOT NULL UNIQUE
);

CREATE TABLE "badge" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "description" VARCHAR(100),
  "active_url" VARCHAR(500),
  "inactive_url" VARCHAR(500)
);

CREATE TABLE "challenge_category" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "icon" VARCHAR(500)
);

CREATE TABLE "location" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(500) NOT NULL,
  "category" VARCHAR(250),
  "latitude" DECIMAL(9, 6) NOT NULL,
  "longitude" DECIMAL(9, 6) NOT NULL
);

CREATE TABLE "challenge" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(500) NOT NULL,
  "location_id" INTEGER NOT NULL,
  "category_id" INTEGER NOT NULL,
  "xp_worth" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "description" VARCHAR(1000),
  CONSTRAINT "fk_challenge_category"
    FOREIGN KEY ("category_id")
    REFERENCES "challenge_category"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "fk_challenge_location"
    FOREIGN KEY ("location_id")
    REFERENCES "location"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE TABLE "awarded_badge" (
  "user_id" INTEGER NOT NULL,
  "badge_id" INTEGER NOT NULL,
  "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "badge_id"),
  CONSTRAINT "fk_ab_badge"
    FOREIGN KEY ("badge_id")
    REFERENCES "badge"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "fk_ab_user"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE TABLE "badge_criteria" (
  "id" SERIAL PRIMARY KEY,
  "badge_id" INTEGER NOT NULL,
  "stat_name" VARCHAR(100) NOT NULL,
  "category_id" INTEGER NOT NULL DEFAULT 0,
  "target_value" INTEGER NOT NULL,
  CONSTRAINT "badge_criteria_badge_id_fkey"
    FOREIGN KEY ("badge_id")
    REFERENCES "badge"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "badge_criteria_category_id_fkey"
    FOREIGN KEY ("category_id")
    REFERENCES "challenge_category"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "badge_criteria_category_rule"
    CHECK (
      "category_id" = 0
      OR "stat_name" = 'category_challenges_completed'
    )
);

CREATE TABLE "user_stat" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "category_id" INTEGER NOT NULL,
  "current_value" INTEGER NOT NULL DEFAULT 0,
  "name" VARCHAR(100) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_us_category"
    FOREIGN KEY ("category_id")
    REFERENCES "challenge_category"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "fk_us_user"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "user_stat_unique"
    UNIQUE ("user_id", "name", "category_id")
);

CREATE TABLE "user_challenge" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "challenge_id" INTEGER NOT NULL,
  "status" "challenge_status" NOT NULL,
  "xp_worth" INTEGER NOT NULL,
  "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at" TIMESTAMPTZ(6),
  "accepted_from_lat" DECIMAL(9, 6),
  "accepted_from_lng" DECIMAL(9, 6),
  "completed_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "expired_at" TIMESTAMPTZ(6),
  "skipped_at" TIMESTAMPTZ(6),
  CONSTRAINT "fk_uc_challenge"
    FOREIGN KEY ("challenge_id")
    REFERENCES "challenge"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT "fk_uc_user"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "badge_criteria_unique"
ON "badge_criteria"("badge_id", "category_id", "stat_name");

CREATE UNIQUE INDEX "user_challenge_user_id_challenge_id_assigned_at_key"
ON "user_challenge"("user_id", "challenge_id", "assigned_at");

CREATE OR REPLACE FUNCTION update_user_stats_on_challenge_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT category_id
    INTO v_category_id
    FROM challenge
    WHERE id = NEW.challenge_id;

    INSERT INTO user_stat (user_id, category_id, name, current_value, updated_at)
    VALUES (NEW.user_id, 0, 'challenges_completed', 1, NOW())
    ON CONFLICT (user_id, category_id, name)
    DO UPDATE
    SET current_value = user_stat.current_value + 1,
        updated_at = NOW();

    INSERT INTO user_stat (user_id, category_id, name, current_value, updated_at)
    VALUES (NEW.user_id, v_category_id, 'category_challenges_completed', 1, NOW())
    ON CONFLICT (user_id, name, category_id)
    DO UPDATE
    SET current_value = user_stat.current_value + 1,
        updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_stats_on_challenge_completion
AFTER INSERT OR UPDATE ON user_challenge
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_challenge_complete();

CREATE OR REPLACE FUNCTION check_badges_on_stat_change()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  eligible BOOLEAN;
BEGIN
  FOR rec IN
    SELECT DISTINCT b.id AS badge_id
    FROM badge_criteria bc
    JOIN badge b ON b.id = bc.badge_id
    WHERE bc.stat_name = NEW.name
      AND bc.category_id = NEW.category_id
  LOOP
    SELECT NOT EXISTS (
      SELECT 1
      FROM badge_criteria bc
      LEFT JOIN user_stat us
        ON us.user_id = NEW.user_id
       AND us.name = bc.stat_name
       AND us.category_id = bc.category_id
      WHERE bc.badge_id = rec.badge_id
        AND COALESCE(us.current_value, 0) < bc.target_value
    )
    INTO eligible;

    IF eligible THEN
      INSERT INTO awarded_badge (user_id, badge_id)
      VALUES (NEW.user_id, rec.badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_badges_on_stat_change
AFTER INSERT OR UPDATE ON user_stat
FOR EACH ROW
EXECUTE FUNCTION check_badges_on_stat_change();

-- Checks if a user has met the criteria for any badges after their stats change.
-- Runs after every insert or update on user_stat.
CREATE OR REPLACE FUNCTION check_badges_on_stat_change()
RETURNS TRIGGER AS $$
DECLARE
    rec RECORD;
    eligible BOOLEAN;
BEGIN
    -- Find all badges that have criteria matching the stat that just changed
    FOR rec IN
        SELECT DISTINCT b.id AS badge_id
        FROM badge_criteria bc
        JOIN badge b ON b.id = bc.badge_id
        WHERE bc.stat_name = NEW.name
          AND bc.category_id = NEW.category_id
    LOOP
        -- Check if all criteria for this badge are met by the user
        -- eligible is true if no criteria has a value below the target
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

        -- Award the badge if all criteria are met, skip if already awarded
        IF eligible THEN
            INSERT INTO awarded_badge (user_id, badge_id)
            VALUES (NEW.user_id, rec.badge_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that fires after any insert or update on user_stat
DROP TRIGGER IF EXISTS trg_check_badges_on_stat_change ON user_stat;

CREATE TRIGGER trg_check_badges_on_stat_change
AFTER INSERT OR UPDATE ON user_stat
FOR EACH ROW
EXECUTE FUNCTION check_badges_on_stat_change();

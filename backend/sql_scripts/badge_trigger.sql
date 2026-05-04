CREATE OR REPLACE FUNCTION check_badges_on_stat_change()
RETURNS TRIGGER AS $$
DECLARE
    rec RECORD;
    eligible BOOLEAN;
BEGIN

    FOR rec IN
        SELECT DISTINCT b.id AS badge_id
        FROM badge_stat_map m
        JOIN badge b ON b.id = m.badge_id
        WHERE m.stat_name = NEW.name
          AND m.category_id = NEW.category_id
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
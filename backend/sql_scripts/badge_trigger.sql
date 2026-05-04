CREATE OR REPLACE FUNCTION check_badges_on_stat_change()
RETURNS TRIGGER AS $$
DECLARE
    rec RECORD;
    eligible BOOLEAN;
BEGIN
    -- Find only badges affected by this stat change
    FOR rec IN
        SELECT DISTINCT b.id AS badge_id
        FROM badge_stat_map m
        JOIN badge b ON b.id = m.badge_id
        WHERE m.stat_name = NEW.name
          AND (
              m.category_id IS NULL
              OR m.category_id = NEW.category_id
          )
    LOOP

        -- Check if ALL criteria for this badge are satisfied
        SELECT NOT EXISTS (
            SELECT 1
            FROM badge_criteria bc
            LEFT JOIN user_stat us
              ON us.user_id = NEW.user_id
             AND us.stat_name = bc.stat_name
             AND (
                  (bc.category_id IS NULL AND us.category_id IS NULL)
                  OR (bc.category_id = us.category_id)
             )
            WHERE bc.badge_id = rec.badge_id
              AND COALESCE(us.current_value, 0) < bc.target_value
        )
        INTO eligible;

        -- Award badge if complete, and if not already awarded
        IF eligible THEN
            INSERT INTO awarded_badge (user_id, badge_id)
            VALUES (NEW.user_id, rec.badge_id)
            ON CONFLICT DO NOTHING;
        END IF;

    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    progress INTEGER;
    v_category_id INTEGER;
    b RECORD;
BEGIN

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'completed' THEN

            SELECT category_id
            INTO v_category_id
            FROM challenge
            WHERE id = NEW.challenge_id;

            INSERT INTO user_stat (user_id, category_id, current_value)
            VALUES (NEW.user_id, v_category_id, 1)
            ON CONFLICT (user_id, category_id)
            DO UPDATE
                SET current_value = user_stat.current_value + 1
            RETURNING current_value INTO progress;

            FOR b IN
                SELECT *
                FROM badge
                WHERE (
                    achievement_criteria->>'type' = 'challenge_completed'
                    OR (
                        achievement_criteria->>'type' = 'category_completed'
                        AND (achievement_criteria->>'category_id')::INTEGER = NEW.category_id
                    )
                ) AND progress >= target_value
            LOOP
                INSERT INTO awarded_badge (user_id, badge_id)
                VALUES (NEW.user_id, b.id)
                ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END IF;

	RETURN NEW;
END;
$$LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_stats_trigger
AFTER UPDATE OF status ON user_challenge
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();
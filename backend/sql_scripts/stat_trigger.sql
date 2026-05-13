CREATE OR REPLACE FUNCTION update_user_stats_on_challenge_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id INTEGER;
BEGIN

    /* When challenge is marked as completed, update the stats for that user */
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN

        /* Get challenge data */
        SELECT category_id
        INTO v_category_id
        FROM challenge
        WHERE id = NEW.challenge_id;

        /* Update total challenges completed stat */
        INSERT INTO user_stat (user_id, category_id, name, current_value, updated_at)
        VALUES (NEW.user_id, 0, 'challenges_completed', 1, NOW())
        ON CONFLICT (user_id, category_id, name)
        DO UPDATE
        SET current_value = user_stat.current_value + 1,
            updated_at = NOW();

        /* Update category completion stat */
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

DROP TRIGGER IF EXISTS trg_update_user_stats_on_challenge_completion ON user_challenge;

CREATE TRIGGER trg_update_user_stats_on_challenge_completion
AFTER INSERT OR UPDATE ON user_challenge
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_challenge_complete();

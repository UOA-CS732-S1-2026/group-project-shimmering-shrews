CREATE OR REPLACE FUNCTION update_badge_progress()
RETURNS TRIGGER AS $$
DECLARE
    category_id INTEGER;
    progress INTEGER;
	b RECORD;
BEGIN
	SELECT category_id INTO category_id
    FROM challenge
    WHERE id = NEW.challenge_id;

    -- Only update badge progress if challenge is changed to completed
    IF NEW.status = 'Completed' AND OLD.status IS DISTINCT FROM 'Completed' THEN
        -- For each badge, check whether progress is made
        FOR b IN
			SELECT *
			FROM badge
			WHERE
				achievement_criteria->>'type' = 'challenge_completed'
				OR (
					achievement_criteria->>'type' = 'category_completed'
					AND (achievement_criteria->>'category_id')::INTEGER = category_id
				)
		LOOP
			progress := null

            -- Handle different types of badge achievement_criteria	

            -- badges involving completing a certain number of any challenges
            IF b.achievement_criteria->>'type' = 'challenge_completed' THEN
                -- if badge progress record doesn't exist, then create one
                INSERT INTO user_badge_progress (user_id, badge_id, current_value)
                VALUES (NEW.user_id, b.id, 1)
                -- if badge progress record already exists, update it instead
                ON CONFLICT (user_id, badge_id)
                DO UPDATE SET current_value = user_badge_progress.current_value + 1
				RETURNING current_value INTO progress;

            -- badges invovling completing a certain number of challenges of a certain category
            ELSIF b.achievement_criteria->>'type' = 'category_completed' THEN
                -- update badges corresponding to completing challenges of the current challenge's category
                IF (b.achievement_criteria->>'category_id')::INTEGER = category_id THEN
                    -- if badge progress record doesn't exist, then create one
                    INSERT INTO user_badge_progress (user_id, badge_id, current_value)
                    VALUES (NEW.user_id, b.id, 1)
                    -- if badge progress record already exists, update it instead
                    ON CONFLICT (user_id, badge_id)
                    DO UPDATE SET current_value = user_badge_progress.current_value + 1
					RETURNING current_value INTO progress;
                END IF;
            END IF;

			-- If the badge progress has reached the target amount, then award the badge.
			-- If they already have the badge, we don't need to do anything.
			IF progress IS NOT NULL AND progress >= b.target_value THEN
				INSERT INTO awarded_badge (user_id, badge_id)
				VALUES (NEW.user_id, b.id)
				ON CONFLICT DO NOTHING;
			END IF;
		END LOOP;
	END IF;

	RETURN NEW;
END;
$$LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER badge_progress_trigger
AFTER UPDATE ON user_challenge
FOR EACH ROW
EXECUTE FUNCTION update_badge_progress();
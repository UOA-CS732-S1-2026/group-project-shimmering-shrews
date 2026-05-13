-- Updates the badge_criteria constraint to ensure category_id is either 0 (global)
-- or the stat_name is 'category_challenges_completed' (category-specific badges).
-- Drops the existing constraint first to allow a clean re-add.
ALTER TABLE badge_criteria
DROP CONSTRAINT IF EXISTS badge_criteria_category_rule;

ALTER TABLE badge_criteria
ADD CONSTRAINT badge_criteria_category_rule
CHECK (
    category_id = 0
    OR stat_name = 'category_challenges_completed'
);
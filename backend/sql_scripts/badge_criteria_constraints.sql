ALTER TABLE badge_criteria
DROP CONSTRAINT IF EXISTS badge_criteria_category_rule;

ALTER TABLE badge_criteria
ADD CONSTRAINT badge_criteria_category_rule
CHECK (
    category_id = 0
    OR stat_name = 'category_challenges_completed'
);

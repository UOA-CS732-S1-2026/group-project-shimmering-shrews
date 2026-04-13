import pool from "../config/database";

// Get all challenges
export const getAllChallenges = async () => {
    const result = await pool.query('SELECT * FROM challenges');
    return result.rows;
};

// Get challenge details
export const getChallengeDetails = async (challengeId: number) => {
    const result = await pool.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
    return result.rows[0];
};

// Post checkin
export const postCheckin = async (challengeId: number, userId: number) => {
    const result = await pool.query('INSERT INTO checkins (challenge_id, user_id) VALUES ($1, $2) RETURNING *', [challengeId, userId]);
    return result.rows[0];
};
import express from 'express';
import { Request, Response } from 'express';
import {
    getAllChallenges,
    getChallengeDetails,
    postCheckin } from '../services/challengeServices';


const router = express.Router();

//Get all challenges
router.get('/', async (req: Request<{id: string}>, res: Response) => {
    try {
        const challenges = await getAllChallenges();
        res.json(challenges);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});



//Get challenge details
router.get('/:id', async (req: Request<{id: string}>, res: Response) => {
    try {
        const challengeId = parseInt(req.params.id as string);
        const challenge = await getChallengeDetails(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(challenge);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenge details' });
    }
});

//Post checkin
router.post('/:id/checkin', async (req: Request<{id: string}>, res: Response) => {
    try {
        const challengeId = parseInt(req.params.id as string);
        const userId = req.body.userId; 

        const checkin = await postCheckin(challengeId, userId);
        res.json(checkin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to post checkin' });
    }
});

export default router;
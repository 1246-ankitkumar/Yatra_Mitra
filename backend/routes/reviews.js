
import express from 'express';
import { Review } from '../models/Review.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// 1. GET - Read all reviews (No login required)
router.get('/', async (req, res) => {
    const destinationKey = req.query.destinationKey;

    let reviews;

    if (destinationKey) {
        reviews = await Review.find({ destinationKey });
    } else {
        reviews = await Review.find();
    }

    res.json({ items: reviews });
});


// Login required for all routes below
router.use(auth);


// 2. POST - Create a new review
router.post('/', async (req, res) => {
    const { destinationKey, destinationName, rating, comment, photos } = req.body;

    // Check required fields
    if (!destinationKey || !rating) {
        return res.status(400).json({
            error: 'Destination and rating are required'
        });
    }

    // Check rating
    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            error: 'Rating must be between 1 and 5'
        });
    }

    // Check whether user already reviewed this destination
    const existingReview = await Review.findOne({
        userId: req.userId,
        destinationKey: destinationKey,
        source: 'user'
    });

    if (existingReview) {
        return res.status(409).json({
            error: 'You already reviewed this destination'
        });
    }

    // Save review in database
    const review = await Review.create({
        userId: req.userId,
        destinationKey: destinationKey,
        destinationName: destinationName,
        rating: rating,
        comment: comment,
        photos: photos,
        source: 'user'
    });

    res.status(201).json({ item: review });
});


// 3. PUT - Update your own review
router.put('/:id', async (req, res) => {
    const { rating, comment, photos } = req.body;

    const changes = {};

    if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: 'Rating must be between 1 and 5'
            });
        }
        changes.rating = rating;
    }

    if (comment !== undefined) {
        changes.comment = comment;
    }

    if (photos !== undefined) {
        changes.photos = photos;
    }

    const review = await Review.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        changes,
        { new: true }
    );

    if (!review) {
        return res.status(404).json({
            error: 'Review not found'
        });
    }

    res.json({ item: review });
});


// 4. DELETE - Delete your own review
router.delete('/:id', async (req, res) => {

    const review = await Review.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });

    if (!review) {
        return res.status(404).json({
            error: 'Review not found'
        });
    }

    res.json({
        message: 'Review deleted successfully'
    });
});

export default router;


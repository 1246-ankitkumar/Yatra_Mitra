
import express from 'express';
import { PackingList } from '../models/PackingList.js';
import { auth } from '../middleware/auth.js';
import { cleanBody } from '../utils/sanitize.js';

const router = express.Router();

// ==================================================
// 1. AUTHENTICATION
// ==================================================

router.use(auth);


// ==================================================
// 2. PACKING ITEMS ACCORDING TO TRIP CATEGORY
// ==================================================

const ITEMS_BY_CATEGORY = {
    mountain: ['Warm jacket', 'Hiking shoes', 'Gloves', 'Sunscreen'],
    beach: ['Sunglasses', 'Swimwear', 'Hat', 'Sunscreen'],
    cold: ['Winter jacket', 'Gloves', 'Woollen socks'],
    adventure: ['Sturdy shoes', 'Flashlight', 'Snacks'],
    religious: ['Modest clothing', 'Scarf', 'Comfortable footwear']
};


// ==================================================
// 3. FUNCTION TO GENERATE PACKING ITEMS
// ==================================================

function makePackingItems(category, weather) {

    // Common items
    const basicItems = [
        'ID/passport',
        'Wallet & cash/cards',
        'Phone & charger',
        'Power bank',
        'Medications',
        'Toiletries'
    ];

    // Category-based items
    const categoryText = String(category || '').toLowerCase();
    let categoryItems = [];

    if (categoryText.includes('mountain')) {
        categoryItems = ITEMS_BY_CATEGORY.mountain;
    }
    else if (categoryText.includes('beach')) {
        categoryItems = ITEMS_BY_CATEGORY.beach;
    }
    else if (categoryText.includes('cold')) {
        categoryItems = ITEMS_BY_CATEGORY.cold;
    }
    else if (categoryText.includes('adventure')) {
        categoryItems = ITEMS_BY_CATEGORY.adventure;
    }
    else if (categoryText.includes('religious')) {
        categoryItems = ITEMS_BY_CATEGORY.religious;
    }

    // Weather-based items
    const weatherText = String(weather || '').toLowerCase();
    let weatherItems = [];

    if (weatherText.includes('rain') || weatherText.includes('monsoon')) {
        weatherItems.push('Umbrella', 'Raincoat');
    }

    if (weatherText.includes('hot') || weatherText.includes('warm')) {
        weatherItems.push('Light clothes', 'Sunscreen', 'Water bottle');
    }

    if (weatherText.includes('cold') || weatherText.includes('snow')) {
        weatherItems.push('Warm layers', 'Gloves');
    }

    // Combine all items
    const allItems = [
        ...new Set([
            ...basicItems,
            ...categoryItems,
            ...weatherItems
        ])
    ];

    // Convert items into objects
    return allItems.map(name => ({
        name: name,
        packed: false,
        category: categoryItems.includes(name)
            ? categoryText || 'activity'
            : 'general'
    }));
}


// ==================================================
// 4. GET - FETCH ALL PACKING LISTS
// ==================================================

router.get('/', async (req, res) => {

    const items = await PackingList.find({
        userId: req.userId
    }).sort({ updatedAt: -1 });

    res.json({ items });
});


// ==================================================
// 5. POST - GENERATE PACKING LIST AUTOMATICALLY
// ==================================================

router.post('/generate', async (req, res) => {

    const {
        destination = '',
        category = '',
        weather = '',
        tripId = null
    } = req.body || {};

    const items = makePackingItems(category, weather);

    const list = await PackingList.create({
        userId: req.userId,
        tripId: tripId,
        destination: destination,
        items: items
    });

    res.status(201).json({ item: list });
});


// ==================================================
// 6. POST - CREATE CUSTOM PACKING LIST
// ==================================================

router.post('/', async (req, res) => {

    const data = cleanBody(req.body);

    const item = await PackingList.create({
        ...data,
        userId: req.userId
    });

    res.status(201).json({ item });
});


// ==================================================
// 7. PUT - UPDATE PACKING LIST
// ==================================================

router.put('/:id', async (req, res) => {

    const data = cleanBody(req.body);

    const item = await PackingList.findOneAndUpdate(
        {
            _id: req.params.id,
            userId: req.userId
        },
        data,
        { returnDocument: 'after' }
    );

    if (!item) {
        return res.status(404).json({
            error: 'Not found'
        });
    }

    res.json({ item });
});


// ==================================================
// 8. DELETE - REMOVE PACKING LIST
// ==================================================

router.delete('/:id', async (req, res) => {

    const item = await PackingList.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });

    if (!item) {
        return res.status(404).json({
            error: 'Not found'
        });
    }

    res.json({ ok: true });
});


// ==================================================
// 9. EXPORT ROUTER
// ==================================================

export default router;

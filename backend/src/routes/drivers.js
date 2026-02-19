const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/drivers/active-map
router.get('/active-map', async (req, res) => {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const activePosts = await prisma.post.findMany({
            where: {
                createdAt: {
                    gt: thirtyMinutesAgo
                },
                matchedUserId: null,
                // Ensure sourceCoordinates exists and is not empty
                sourceCoordinates: {
                    not: ""
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        hasCustomPhoto: true,
                        // We might want to send car info if available, but for now just avatar
                    }
                }
            }
        });

        const drivers = activePosts.map(post => {
            // Parse coordinates if stored as string
            let coords = null;
            try {
                // sourceCoordinates is likely a JSON string or "lat,lon" string? 
                // In Post model it is String. In PostScreen.tsx it is JSON.stringify({latitude, longitude})
                if (post.sourceCoordinates) {
                    // Handle potential double stringify or direct object
                    if (typeof post.sourceCoordinates === 'string') {
                        if (post.sourceCoordinates.startsWith('{')) {
                            coords = JSON.parse(post.sourceCoordinates);
                        } else {
                            // Maybe it is something else?
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing sourceCoordinates for post " + post.id, e);
            }

            if (!coords || !coords.latitude || !coords.longitude) return null;

            return {
                id: post.user.id,
                name: post.user.name,
                hasCustomPhoto: post.user.hasCustomPhoto,
                latitude: coords.latitude,
                longitude: coords.longitude,
                postId: post.id
            };
        }).filter(d => d !== null);

        res.json(drivers);
    } catch (error) {
        console.error('Error fetching active drivers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

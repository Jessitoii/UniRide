const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth'); // Import the auth middleware

const prisma = new PrismaClient();

// Haversine formula to calculate the distance between two points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch posts near a location
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, university, faculty } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const now = new Date();

    let posts;
    if (university && faculty) {
      posts = await prisma.post.findMany({
        where: {
          destinationUniversity: university,
          destinationFaculty: faculty,
          OR: [
            {
              datetimeStart: {
                gt: now,
              },
            },
            {
              datetimeEnd: {
                gt: now,
              },
            },
          ],
        },
        include: {
          user: true,
          interestedUsers: true,
        },
      });
    } else {
      posts = await prisma.post.findMany({
        where: {
          OR: [
            {
              datetimeStart: {
                gt: now,
              },
            },
            {
              datetimeEnd: {
                gt: now,
              },
            },
          ],
        },
        include: {
          user: true,
          interestedUsers: true,
        },
      });
    }

    const userLatitude = parseFloat(latitude);
    const userLongitude = parseFloat(longitude);

    console.log("Posts:", posts.length);
    

    const nearbyPosts = posts
      .map((post) => {
        const routeCoordinates = JSON.parse(JSON.parse(post.route));
        const distances = routeCoordinates.map((coord) => {
          return haversineDistance(
            userLatitude,
            userLongitude,
            coord.latitude,
            coord.longitude
          );
        });
        const minDistance = Math.min(...distances);
        return { ...post, minDistance };
      })
      .filter((post) => post.minDistance <= 5) // Exclude posts with min distance > 5 km
      .sort((a, b) => a.minDistance - b.minDistance); // Sort by min distance

    res.json(nearbyPosts);
  } catch (error) {
    console.error('Error fetching nearby posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        interestedUsers: {
          select: {
            user: true,
            post: true,
            locationCoordinates: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { sourceAddress, sourceCoordinates, destinationUniversity, destinationFaculty, route, datetimeStart, datetimeEnd, price } = req.body;
    const userId = req.user.userId;

    const post = await prisma.post.create({
      data: {
        userId,
        sourceAddress,
        sourceCoordinates: JSON.stringify(sourceCoordinates),
        destinationUniversity,
        destinationFaculty,
        route: JSON.stringify(route),
        datetimeStart: new Date(datetimeStart),
        datetimeEnd: new Date(datetimeEnd),
        price,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: true,
        interestedUsers: {
          select: {
            user: true,
            post: true,
            locationCoordinates: true,
          },
        },
      },
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a post
router.put('/:postId', auth, async (req, res) => {
  const { postId } = req.params;
  const { sourceAddress, sourceCoordinates, destinationUniversity, destinationFaculty, route, datetimeStart, datetimeEnd, price } = req.body;

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        sourceAddress,
        sourceCoordinates: JSON.stringify(sourceCoordinates),
        destinationUniversity,
        destinationFaculty,
        route: JSON.stringify(route),
        datetimeStart: new Date(datetimeStart),
        datetimeEnd: new Date(datetimeEnd),
        price,
      },
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an interested user to a post
router.post('/:id/interested', auth, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.userId;
    const { locationCoordinates } = req.body;

    // Check if the user is already interested
    const existingEntry = await prisma.interestedUser.findFirst({
      where: {
        userId: userId,
        postId: postId,
      },
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'User already interested in this post' });
    }

    // Create a new InterestedUser entry
    const userPost = await prisma.interestedUser.create({
      data: {
        userId,
        postId,
        locationCoordinates: JSON.stringify(locationCoordinates),
      },
    });

    res.status(201).json({ message: 'User added to interested list', userPost });
  } catch (error) {
    console.error('Error adding interested user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:postId/match', auth, async (req, res) => {
  const { postId } = req.params;
  const { matchedUserId } = req.body;

  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { matchedUserId },
    });

    const matchedUser = await prisma.user.update({
      where: { id: matchedUserId },
      data: { matchedPosts: { connect: { id: postId } } },
    });

    res.json({ post, matchedUser });
  } catch (error) {
    console.error('Error matching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from the decoded token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          include: {
            interestedUsers: true,
          },
        }, // Include posts relation
        car: true,   // Include car relation
        wallet: true, // Include wallet relation
        interestedIn: {
          include: {
            post: true,
            user: true,
          },
        }, // Include interestedIn relation
        matchedPosts: true, // Include matchedPosts relation
        reviewMade: true, // Include reviewMade relation
        reviewReceived: true, // Include reviewReceived relation
        messagesSent: true, // Include messagesSent relation
        messagesReceived: true, // Include messagesReceived relation
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
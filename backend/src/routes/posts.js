const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware
const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('../services/notificationService');

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
        user: {
          include: {
            car: true,
          }
        },
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
    console.log(post);

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { sourceAddress, sourceCoordinates, destinationUniversity, destinationFaculty, route, datetimeStart, datetimeEnd } = req.body;
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
      },
      include: {
        user: true,
      },
    });

    // No notifications for post creation as it doesn't directly affect other users
    // We can add system notifications here in the future if needed

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
  const { sourceAddress, sourceCoordinates, destinationUniversity, destinationFaculty, route, datetimeStart, datetimeEnd } = req.body;

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

    // Check if seats are available (matchedUserId != null)
    const postCheck = await prisma.post.findUnique({ where: { id: postId } });
    if (!postCheck) return res.status(404).json({ message: 'Post not found' });
    if (postCheck.matchedUserId) {
      return res.status(400).json({ message: 'Ride is full (Seats not available)' });
    }

    // Create a new InterestedUser entry
    const userPost = await prisma.interestedUser.create({
      data: {
        userId,
        postId,
        locationCoordinates: JSON.stringify(locationCoordinates),
      },
    });

    // Fetch post and user details for the notification
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }
    });

    const interestedUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (post && post.user && interestedUser) {
      // Notify the post owner that someone is interested in their ride
      await createNotification(
        post.user.id,
        'match',
        'Yeni İlgilenen Yolcu!',
        `${interestedUser.name} güzergahınızla ilgileniyor.`,
        postId,
        'Post'
      );
    }

    res.status(201).json({ message: 'User added to interested list', userPost });
  } catch (error) {
    console.error('Error adding interested user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:postId/match', auth, async (req, res) => {
  const { postId } = req.params;
  const { matchedUserId } = req.body;
  const driverId = req.user.userId;

  try {
    const postCheck = await prisma.post.findUnique({ where: { id: postId } });
    if (!postCheck) return res.status(404).json({ message: 'Post not found' });
    if (postCheck.matchedUserId) {
      return res.status(400).json({ message: 'Ride is full (Seats not available)' });
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: { matchedUserId },
      include: { user: true }
    });

    const matchedUser = await prisma.user.update({
      where: { id: matchedUserId },
      data: { matchedPosts: { connect: { id: postId } } },
    });

    // Create notification for the matched passenger
    await createNotification(
      matchedUserId,
      'match',
      'Yolculuk Eşleşmesi Onaylandı!',
      `${post.user.name} sizinle yolculuğu paylaşmayı onayladı.`,
      postId,
      'Post'
    );

    // Create notification for the driver
    await createNotification(
      driverId,
      'match',
      'Yolcu Eşleşmesi Tamamlandı',
      `${matchedUser.name} ile yolculuk eşleşmeniz tamamlandı.`,
      postId,
      'Post'
    );

    res.json({ post, matchedUser });
  } catch (error) {
    console.error('Error matching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint to cancel a match
router.post('/:postId/cancel-match', auth, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;

  try {
    // Get the post with current match info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isDriver = post.userId === userId;
    const matchedUserId = post.matchedUserId;

    // Only allow the driver or matched passenger to cancel
    if (!isDriver && matchedUserId !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this match' });
    }

    // Get the other user's info for notification
    const otherUserId = isDriver ? matchedUserId : post.userId;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Update the post to remove the match
    await prisma.post.update({
      where: { id: postId },
      data: { matchedUserId: null }
    });

    // If passenger was matched, remove the connection
    if (matchedUserId) {
      await prisma.user.update({
        where: { id: matchedUserId },
        data: { matchedPosts: { disconnect: { id: postId } } }
      });
    }

    // Create notifications for both parties
    if (otherUser && currentUser) {
      await createNotification(
        otherUserId,
        'ride',
        'Yolculuk İptali',
        `${currentUser.name} yolculuk eşleşmesini iptal etti.`,
        postId,
        'Post'
      );

      // Notification for the person canceling
      await createNotification(
        userId,
        'system',
        'Yolculuk İptal Edildi',
        `${post.sourceAddress} - ${post.destinationUniversity} yolculuk eşleşmesini iptal ettiniz.`,
        postId,
        'Post'
      );
    }

    res.json({ message: 'Match cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling match:', error);
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
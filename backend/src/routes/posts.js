const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the auth middleware
const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

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

// Helper for Robust Geometry Parsing
function safeParseCoordinates(route) {
  try {
    if (!route) return [];
    if (Array.isArray(route)) return route; // Already an array
    if (typeof route === 'object') return route; // Object (unlikely for coordinates list but safe)

    let parsed = JSON.parse(route);
    // Handle double-stringified JSON
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Coordinate Parsing Error:", error.message);
    return []; // Default empty array as requested
  }
}

// Get ongoing/pending interests for the current user
router.get('/my-interests', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const posts = await prisma.post.findMany({
      where: {
        interestedUsers: {
          some: {
            userId: userId
          }
        },
        // matchedUserId: null, // Removed to show matched posts (Closed/Lost)
        datetimeStart: {
          gt: new Date() // Only future rides
        }
      },
      include: {
        user: true,
        interestedUsers: {
          where: {
            userId: userId
          }
        }
      },
      orderBy: {
        datetimeStart: 'asc'
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching my interests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch posts near a location
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, university, faculty, destinationUniversity, destinationFaculty } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const now = new Date();
    // 1. Temporal Buffer: include rides that started within the last 30 minutes
    const gracePeriod = new Date(now.getTime() - 30 * 60000);

    const searchUni = university || destinationUniversity;
    const searchFac = faculty || destinationFaculty;

    // 2. Predicate Loosening & Robust matchedUserId
    const whereClause = {
      OR: [
        { matchedUserId: null },
        { matchedUserId: { isSet: false } }
      ],
      datetimeStart: {
        gt: gracePeriod,
      },
    };

    // Implement Fuzzy/Insensitive Matching
    if (searchUni) {
      whereClause.destinationUniversity = {
        contains: searchUni,
        mode: 'insensitive'
      };
    }
    if (searchFac) {
      whereClause.destinationFaculty = {
        contains: searchFac,
        mode: 'insensitive'
      };
    }

    // Logging Expansion
    console.log('[Nearby] Query whereClause:', JSON.stringify(whereClause, null, 2));

    // 5. Prisma Include Optimization
    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        user: true,
        interestedUsers: {
          include: {
            user: true, // Avoid N+1 by including user details
          }
        },
      },
    });

    const userLatitude = parseFloat(latitude);
    const userLongitude = parseFloat(longitude);

    console.log(`[Nearby] Found ${posts.length} candidate posts before geo-filtering.`);

    const nearbyPosts = posts
      .map((post) => {
        // 3. Robust Geometry Parsing
        const routeCoordinates = safeParseCoordinates(post.route);

        // Technical Constraint: Do not return null. Handle empty coords gracefully.
        if (routeCoordinates.length === 0) {
          return { ...post, minDistance: Infinity };
        }

        const distances = routeCoordinates.map((coord) => {
          return haversineDistance(
            userLatitude,
            userLongitude,
            coord.latitude || coord.lat,
            coord.longitude || coord.lng || coord.long
          );
        });

        const minDistance = distances.length > 0 ? Math.min(...distances) : Infinity;
        return { ...post, minDistance };
      });

    // 4. Distance Logic Audit
    const logPreview = nearbyPosts.slice(0, 5).map(p => ({ id: p.id, dist: p.minDistance, routeLen: safeParseCoordinates(p.route).length }));
    console.log("[Nearby] Distance Audit (First 5):", JSON.stringify(logPreview, null, 2));

    const finalPosts = nearbyPosts
      .filter((post) => post.minDistance <= 10) // Limit to 10km radius
      .sort((a, b) => a.minDistance - b.minDistance);

    console.log(`[Nearby] Returning ${finalPosts.length} posts after distance filter.`);

    res.json(finalPosts);
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
        sourceCoordinates: typeof sourceCoordinates === 'string' ? sourceCoordinates : JSON.stringify(sourceCoordinates),
        destinationUniversity,
        destinationFaculty,
        route: typeof route === 'string' ? route : JSON.stringify(route),
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
    const { university, faculty, destinationUniversity, destinationFaculty } = req.query;

    const now = new Date();
    const gracePeriod = new Date(now.getTime() - 30 * 60000);

    const searchUni = university || destinationUniversity;
    const searchFac = faculty || destinationFaculty;

    // Construct robust whereClause
    const whereClause = {
      OR: [
        { matchedUserId: null },
        { matchedUserId: { isSet: false } }
      ],
      datetimeStart: {
        gt: gracePeriod,
      },
    };

    if (searchUni) {
      whereClause.destinationUniversity = {
        contains: searchUni,
        mode: 'insensitive'
      };
    }
    if (searchFac) {
      whereClause.destinationFaculty = {
        contains: searchFac,
        mode: 'insensitive'
      };
    }

    console.log('[GET /] Query whereClause:', JSON.stringify(whereClause, null, 2));

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        user: true,
        interestedUsers: {
          include: {
            user: true
          }
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
    const { id: postId } = req.params;
    const userId = req.user.userId;

    // Get post details before deletion to notify users
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        interestedUsers: true,
        matchedUser: true
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Notify matched user
    if (post.matchedUserId) {
      await createNotification(
        post.matchedUserId,
        'ride',
        'Yolculuk Silindi',
        `Sürücü ${post.sourceAddress} - ${post.destinationUniversity} yolculuğunu sildi.`,
        postId,
        'Post'
      );
    }

    // Notify interested users
    for (const entry of post.interestedUsers) {
      if (entry.userId !== post.matchedUserId) {
        await createNotification(
          entry.userId,
          'ride',
          'Yolculuk Yayından Kaldırıldı',
          `İlgilendiğiniz ${post.sourceAddress} - ${post.destinationUniversity} yolculuğu sürücü tarafından silindi.`,
          postId,
          'Post'
        );
      }
    }

    // First delete relations if using MongoDB (sometimes Prisma needs manual cleanup for many-to-many or some relations)
    // Actually Prisma with MongoDB handles some but let's be safe if there are issues.
    // InterestedUser should be deleted by cascade or manually.
    await prisma.interestedUser.deleteMany({
      where: { postId: postId }
    });

    await prisma.post.delete({
      where: { id: postId },
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
        createdAt: new Date()
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

    // Authorization check
    if (postCheck.userId !== driverId) return res.status(403).json({ message: 'Only the driver can execute this action' });

    if (postCheck.matchedUserId) {
      return res.status(400).json({ message: 'Ride is full (Seats not available)' });
    }

    // Temporal check: prevent matching past rides
    if (new Date(postCheck.datetimeStart) < new Date()) {
      return res.status(400).json({ message: 'Cannot match past rides' });
    }

    // Status check
    if (postCheck.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Ride is no longer active' });
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

    // Send email to passenger
    try {
      if (matchedUserId) {
        // We only fetched user in include on update. Let's make sure matchedUser has email.
        const passenger = await prisma.user.findUnique({ where: { id: matchedUserId } });
        if (passenger && passenger.email) {
          const emailHtml = `
               <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                 <h2 style="color: #FF007A;">Tebrikler!</h2>
                 <p><strong>${post.user.name}</strong> ile eşleştiniz.</p>
                 <p>Yolculuk detaylarını uygulamanızdan görüntüleyebilirsiniz.</p>
                 <div style="margin-top: 20px; text-align: center;">
                   <a href="#" style="background-color: #FF007A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Yolculuğu Görüntüle</a>
                 </div>
               </div>
             `;
          await sendEmail(passenger.email, 'KampüsRoute: Yolculuk Eşleşmesi Onaylandı!', emailHtml);
        }
      }
    } catch (emailError) {
      console.error('Failed to send match email:', emailError);
      // Do not fail the request, just log
    }

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



// Complete a ride
router.post('/:id/complete', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Only the driver can complete the ride' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error completing ride:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
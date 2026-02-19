const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Token verification failed:", err.message);
        return res.status(403).json({ message: 'Failed to authenticate token', error: err.message });
      }
      // console.log("authenticated token"); // Optional: reduce noise
      req.user = decoded; // Attach the decoded user information to the request
      next();
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = auth; 
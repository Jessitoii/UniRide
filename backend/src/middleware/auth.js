const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("failed to authenticate token")
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    console.log("authenticated token")
    req.user = decoded; // Attach the decoded user information to the request
    next();
  });
};

module.exports = auth; 
import jwt from 'jsonwebtoken';

/**
 * Socket.IO middleware for JWT authentication.
 * Reads token from socket.handshake.auth.token, verifies it,
 * and exposes userId / isAdmin on socket.data.
 */
const socketAuth = (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication error: no token provided'));
    }

    jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error: invalid token'));
        }
        socket.data.userId = decoded.userId;
        socket.data.isAdmin = decoded.isAdmin;
        next();
    });
};

export default socketAuth;

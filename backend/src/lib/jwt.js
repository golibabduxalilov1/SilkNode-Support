import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, name: user.fullname }, config.jwtSecret, { expiresIn: '30d' });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

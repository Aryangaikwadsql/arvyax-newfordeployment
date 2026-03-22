import express from 'express';
import { app } from '../backend/server.js';

export default async function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// For Vercel compatibility
export const config = {
  api: {
    bodyParser: false,
  },
};

import { Router } from 'express';
import { getDb } from '../db/connection.js';

export function createNodesRouter() {
  const router = Router();
  const db = getDb();

  router.get('/api/nodes', (req, res) => {
    const nodes = db.prepare('SELECT * FROM nodes ORDER BY node_id ASC').all();
    res.json(nodes);
  });

  return router;
}

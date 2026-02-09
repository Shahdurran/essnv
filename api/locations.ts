import type { VercelRequest, VercelResponse } from '@vercel/node';

// CRITICAL: Practice locations are now USER-ISOLATED in Neon DB.
// Each user sees ONLY their own locations based on user_id.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql, eq } from 'drizzle-orm';

// Inline practice_locations table definition with user isolation
const practiceLocations = pgTable("practice_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // CRITICAL: Links location to specific user
  name: text("name").notNull(),
  address: text("address").default(''),
  city: text("city").default(''),
  state: text("state").default(''),
  zipCode: text("zip_code").default(''),
  phone: text("phone").default(''),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Initialize Neon DB connection
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING;
let db: any = null;

try {
  if (databaseUrl) {
    const sqlConnection = neon(databaseUrl);
    db = drizzle(sqlConnection);
    console.log('[LOCATIONS API] Neon DB connection initialized');
  } else {
    console.log('[LOCATIONS API] No DATABASE_URL found');
  }
} catch (error) {
  console.error('[LOCATIONS API] Failed to initialize Neon DB:', error);
}

// In-memory storage fallback (EMPTY - no hardcoded locations)
let LOCATIONS: any[] = [];

// Helper to get userId from token
function getUserIdFromToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  // Token format: username_timestamp
  return token.split('_')[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Set cache-control headers for multi-device sync
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`[LOCATIONS API] Request: ${req.method} ${req.url}`);

    // Get userId from token for isolation
    const userId = getUserIdFromToken(req);
    console.log(`[LOCATIONS API] User: ${userId || 'anonymous'}`);

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // GET /api/locations - List locations for current user ONLY
    if (req.method === 'GET') {
      if (db) {
        try {
          // CRITICAL: Filter by user_id for isolation
          const dbLocations = await db
            .select()
            .from(practiceLocations)
            .where(eq(practiceLocations.userId, userId));
          
          const locations = dbLocations.map((loc: any) => ({
            id: loc.id,
            userId: loc.userId,
            name: loc.name,
            address: loc.address || '',
            city: loc.city || '',
            state: loc.state || '',
            zipCode: loc.zipCode || '',
            phone: loc.phone || '',
            isActive: loc.isActive !== false
          }));
          
          console.log('[LOCATIONS API] Loaded', locations.length, 'locations for user:', userId);
          return res.status(200).json(locations);
        } catch (dbError) {
          console.error('[LOCATIONS API] DB error:', dbError);
        }
      }
      // Fall back to empty array
      console.log('[LOCATIONS API] No locations in DB for user:', userId);
      return res.status(200).json([]);
    }

    // POST /api/locations - Create new location for current user
    if (req.method === 'POST') {
      const locationData = req.body;

      if (!locationData.name) {
        return res.status(400).json({ message: 'Location name is required' });
      }

      if (db) {
        try {
          const newLocation = {
            id: locationData.id || sql`gen_random_uuid()`,
            userId: userId, // CRITICAL: Link to current user
            name: locationData.name,
            address: locationData.address || '',
            city: locationData.city || '',
            state: locationData.state || '',
            zipCode: locationData.zipCode || '',
            phone: locationData.phone || '',
            isActive: locationData.isActive !== undefined ? locationData.isActive : true
          };
          
          await db.insert(practiceLocations).values(newLocation);
          console.log('[LOCATIONS API] Created location for user:', userId, 'Name:', newLocation.name);
          
          return res.status(201).json({
            id: newLocation.id,
            userId: newLocation.userId,
            name: newLocation.name,
            address: newLocation.address,
            phone: newLocation.phone,
            isActive: newLocation.isActive
          });
        } catch (dbError: any) {
          if (dbError.code === '23505') {
            return res.status(409).json({ message: 'Location with this ID already exists' });
          }
          console.error('[LOCATIONS API] DB error creating location:', dbError);
        }
      }
      
      // Fallback to in-memory
      const newLocation = {
        id: locationData.id || `location-${Date.now()}`,
        userId: userId,
        name: locationData.name,
        address: locationData.address || '',
        phone: locationData.phone || '',
        isActive: locationData.isActive !== false
      };
      
      LOCATIONS.push(newLocation);
      console.log('[LOCATIONS API] Created location in memory:', newLocation);
      return res.status(201).json(newLocation);
    }

    // PUT /api/locations - Update location (only if owned by user)
    if (req.method === 'PUT') {
      const updates = req.body;
      const locationId = updates.id;
      
      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      if (db) {
        try {
          // First check if location exists AND belongs to user
          const existing = await db
            .select()
            .from(practiceLocations)
            .where(eq(practiceLocations.id, locationId));
          
          if (existing.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
          }
          
          if (existing[0].userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this location' });
          }
          
          const updateData: any = {
            name: updates.name,
            address: updates.address || '',
            city: updates.city || '',
            state: updates.state || '',
            zipCode: updates.zipCode || '',
            phone: updates.phone || '',
            isActive: updates.isActive !== undefined ? updates.isActive : true
          };
          
          await db.update(practiceLocations)
            .set(updateData)
            .where(eq(practiceLocations.id, locationId));
          
          console.log('[LOCATIONS API] Updated location for user:', userId);
          
          // Return updated location
          return res.status(200).json({
            id: locationId,
            userId: userId,
            name: updateData.name,
            address: updateData.address,
            phone: updateData.phone,
            isActive: updateData.isActive
          });
        } catch (dbError) {
          console.error('[LOCATIONS API] DB error updating location:', dbError);
        }
      }
      
      // Fallback to in-memory update
      const locationIndex = LOCATIONS.findIndex(loc => loc.id === locationId);
      
      if (locationIndex === -1) {
        return res.status(404).json({ message: 'Location not found' });
      }

      // Check ownership
      if (LOCATIONS[locationIndex].userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this location' });
      }

      LOCATIONS[locationIndex] = {
        ...LOCATIONS[locationIndex],
        ...updates,
        id: locationId,
        userId: userId
      };
      
      console.log('[LOCATIONS API] Updated location in memory:', LOCATIONS[locationIndex]);
      return res.status(200).json(LOCATIONS[locationIndex]);
    }

    // DELETE /api/locations - Delete location (only if owned by user)
    if (req.method === 'DELETE') {
      const { id: locationId } = req.body;
      
      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      if (db) {
        try {
          // First check if location exists AND belongs to user
          const existing = await db
            .select()
            .from(practiceLocations)
            .where(eq(practiceLocations.id, locationId));
          
          if (existing.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
          }
          
          if (existing[0].userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this location' });
          }
          
          await db.delete(practiceLocations)
            .where(eq(practiceLocations.id, locationId));
          
          console.log('[LOCATIONS API] Deleted location for user:', userId);
          return res.status(200).json({ message: 'Location deleted successfully' });
        } catch (dbError) {
          console.error('[LOCATIONS API] DB error deleting location:', dbError);
        }
      }
      
      // Fallback to in-memory delete
      const locationIndex = LOCATIONS.findIndex(loc => loc.id === locationId);
      
      if (locationIndex === -1) {
        return res.status(404).json({ message: 'Location not found' });
      }

      // Check ownership
      if (LOCATIONS[locationIndex].userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this location' });
      }

      const deletedLocation = LOCATIONS[locationIndex];
      LOCATIONS.splice(locationIndex, 1);
      
      console.log('[LOCATIONS API] Deleted location from memory:', deletedLocation);
      return res.status(200).json({ message: 'Location deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error("[LOCATIONS API] Error:", error);
    return res.status(500).json({ 
      message: "Failed to process location request",
      error: error.message 
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

// CRITICAL: Practice locations are now fetched from Neon DB ONLY.
// If the DB returns nothing, use an empty array '[]' as the fallback.
// NO hardcoded location arrays are used.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, varchar, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Inline practice_locations table definition (matches shared/schema.ts)
const practiceLocations = pgTable("practice_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
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

// Helper function to generate ID from name
function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Set cache-control headers for multi-device sync
  // Ensures app.medidentai.com never serves cached data from browser or Vercel edge
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

    // GET /api/locations - List all locations from Neon DB ONLY
    if (req.method === 'GET') {
      // Fetch from Neon DB
      if (db) {
        try {
          const dbLocations = await db.select().from(practiceLocations);
          const locations = dbLocations.map(loc => ({
            id: loc.id,
            name: loc.name,
            address: loc.address || '',
            city: loc.city || '',
            state: loc.state || '',
            zipCode: loc.zipCode || '',
            phone: loc.phone || '',
            isActive: loc.isActive !== false
          }));
          console.log('[LOCATIONS API] Loaded', locations.length, 'locations from Neon DB');
          return res.status(200).json(locations);
        } catch (dbError) {
          console.error('[LOCATIONS API] DB error:', dbError);
        }
      }
      // Fall back to empty array - NO hardcoded locations
      console.log('[LOCATIONS API] No locations in DB, returning empty array []');
      return res.status(200).json([]);
    }

    // POST /api/locations - Create new location
    if (req.method === 'POST') {
      const locationData = req.body;

      if (!locationData.name) {
        return res.status(400).json({ message: 'Location name is required' });
      }

      // Create location in Neon DB
      if (db) {
        try {
          const newLocation = {
            id: locationData.id || sql`gen_random_uuid()`,
            name: locationData.name,
            address: locationData.address || null,
            city: locationData.city || null,
            state: locationData.state || null,
            zipCode: locationData.zipCode || null,
            phone: locationData.phone || null,
            isActive: locationData.isActive !== undefined ? locationData.isActive : true
          };
          
          await db.insert(practiceLocations).values(newLocation);
          console.log('[LOCATIONS API] Created location in DB:', newLocation.name);
          
          return res.status(201).json({
            id: newLocation.id,
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
      
      // Fallback to in-memory (should not be used in production)
      const newLocation = {
        id: locationData.id || `location-${Date.now()}`,
        name: locationData.name,
        address: locationData.address || '',
        phone: locationData.phone || '',
        isActive: locationData.isActive !== false
      };
      
      LOCATIONS.push(newLocation);
      console.log('[LOCATIONS API] Created location in memory:', newLocation);
      return res.status(201).json(newLocation);
    }

    // PUT /api/locations - Update location
    if (req.method === 'PUT') {
      const updates = req.body;
      const locationId = updates.id;
      
      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      // Update in Neon DB
      if (db) {
        try {
          const updateData: any = {
            name: updates.name,
            address: updates.address || null,
            city: updates.city || null,
            state: updates.state || null,
            zipCode: updates.zipCode || null,
            phone: updates.phone || null,
            isActive: updates.isActive !== undefined ? updates.isActive : true
          };
          
          await db.update(practiceLocations)
            .set(updateData)
            .where(sql`${practiceLocations.id} = ${locationId}`);
          
          console.log('[LOCATIONS API] Updated location in DB:', locationId);
          
          // Fetch and return updated location
          const updatedLocs = await db.select().from(practiceLocations).where(sql`${practiceLocations.id} = ${locationId}`);
          if (updatedLocs.length > 0) {
            const loc = updatedLocs[0];
            return res.status(200).json({
              id: loc.id,
              name: loc.name,
              address: loc.address,
              phone: loc.phone,
              isActive: loc.isActive
            });
          }
        } catch (dbError) {
          console.error('[LOCATIONS API] DB error updating location:', dbError);
        }
      }
      
      // Fallback to in-memory update
      const locationIndex = LOCATIONS.findIndex(loc => loc.id === locationId);
      
      if (locationIndex === -1) {
        return res.status(404).json({ message: 'Location not found' });
      }

      LOCATIONS[locationIndex] = {
        ...LOCATIONS[locationIndex],
        ...updates,
        id: locationId
      };
      
      console.log(`[LOCATIONS API] Updated location in memory:`, LOCATIONS[locationIndex]);
      return res.status(200).json(LOCATIONS[locationIndex]);
    }

    // DELETE /api/locations - Delete location (ID in body)
    if (req.method === 'DELETE') {
      const { id: locationId } = req.body;
      
      if (!locationId) {
        return res.status(400).json({ message: 'Location ID is required in request body' });
      }

      // Delete from Neon DB
      if (db) {
        try {
          await db.delete(practiceLocations).where(sql`${practiceLocations.id} = ${locationId}`);
          console.log('[LOCATIONS API] Deleted location from DB:', locationId);
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

      const deletedLocation = LOCATIONS[locationIndex];
      LOCATIONS.splice(locationIndex, 1);
      
      console.log(`[LOCATIONS API] Deleted location from memory:`, deletedLocation);
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

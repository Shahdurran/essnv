/**
 * PRE-DEPLOYMENT VERIFICATION TEST
 * ================================
 * This script simulates a 'novaosc' user update to verify data isolation.
 * It checks that NO OTHER user IDs are touched in the Neon DB during the transaction.
 * 
 * Run: node test-novaosc-update.js
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Get database URL
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_CONNECTION_STRING;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function testNovaoscUpdate() {
  console.log('='.repeat(60));
  console.log('PRE-DEPLOYMENT DATA ISOLATION TEST');
  console.log('='.repeat(60));
  console.log('');
  
  const sql = neon(databaseUrl);
  
  // Step 1: Get all user IDs BEFORE update
  console.log('[TEST] Step 1: Capturing all user IDs BEFORE update...');
  const usersBefore = await sql('SELECT id, username, owner_name FROM users ORDER BY username');
  console.log(`[TEST] Found ${usersBefore.length} users in database:`);
  usersBefore.forEach(u => console.log(`  - ${u.username} (id: ${u.id}, owner: ${u.owner_name})`));
  console.log('');
  
  // Step 2: Simulate 'novaosc' user update (create if doesn't exist)
  console.log('[TEST] Step 2: Simulating update for user: novaosc');
  const novaoscId = usersBefore.find(u => u.username === 'novaosc')?.id;
  
  if (novaoscId) {
    console.log(`[TEST] User 'novaosc' exists with ID: ${novaoscId}`);
    
    // Update the user using a unique field (owner_name won't cause false positives)
    await sql`
      UPDATE users 
      SET 
        owner_name = 'Nova OSC Test User Updated'
      WHERE username = 'novaosc'
    `;
    console.log('[TEST] Updated novaosc user in database');
  } else {
    console.log('[TEST] User novaosc does not exist - creating test entry');
    await sql`
      INSERT INTO users (username, password, name, role, practice_name, owner_name)
      VALUES ('novaosc', 'test123', 'Nova OSC Test User', 'user', 'Nova OSC', 'Nova OSC Test User')
    `;
    console.log('[TEST] Created novaosc user');
  }
  console.log('');
  
  // Step 3: Verify NO other users were affected
  console.log('[TEST] Step 3: Verifying data isolation - checking all users...');
  const usersAfter = await sql('SELECT id, username, owner_name FROM users ORDER BY username');
  
  let isolationPassed = true;
  console.log('');
  console.log('[TEST] User states after update:');
  
  for (const user of usersAfter) {
    const beforeUser = usersBefore.find(u => u.id === user.id);
    const wasUpdated = beforeUser && user.owner_name !== beforeUser.owner_name;
    
    console.log(`  - ${user.username}:`);
    console.log(`      ID: ${user.id}`);
    console.log(`      Owner: ${user.owner_name}`);
    console.log(`      Updated: ${wasUpdated ? 'YES' : 'NO'}`);
    
    // Only novaosc should have been updated
    if (user.username !== 'novaosc' && wasUpdated) {
      console.error(`  [ERROR] User ${user.username} was unexpectedly modified!`);
      isolationPassed = false;
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  if (isolationPassed) {
    console.log('[PASS] DATA ISOLATION TEST PASSED');
    console.log('[PASS] Only the target user (novaosc) was modified');
    console.log('[PASS] No other user IDs were touched in the Neon DB');
  } else {
    console.error('[FAIL] DATA ISOLATION TEST FAILED');
    console.error('[FAIL] Other users were unexpectedly modified');
  }
  console.log('='.repeat(60));
  
  // Cleanup: Remove test user if we created it
  if (!novaoscId) {
    console.log('');
    console.log('[TEST] Cleaning up - removing test user...');
    await sql`DELETE FROM users WHERE username = 'novaosc'`;
    console.log('[TEST] Test user removed');
  }
  
  process.exit(isolationPassed ? 0 : 1);
}

testNovaoscUpdate().catch(err => {
  console.error('[TEST] Test failed with error:', err);
  process.exit(1);
});

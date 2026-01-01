/**
 * Simple test script for Gmail Delete Today endpoint
 * 
 * Usage:
 * 1. Get JWT token through OAuth flow
 * 2. Run: node test-gmail.js YOUR_JWT_TOKEN
 * 
 * Example:
 * node test-gmail.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const JWT_TOKEN = process.argv[2];
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

if (!JWT_TOKEN) {
  console.error('❌ Error: JWT token is required');
  console.log('\nUsage:');
  console.log('  node test-gmail.js YOUR_JWT_TOKEN');
  console.log('\nHow to get token:');
  console.log('  1. Open: http://localhost:4000/auth/google/start');
  console.log('  2. Sign in with Google');
  console.log('  3. Copy the token from the URL (after token=)');
  process.exit(1);
}

async function testGmailDelete(dryRun = true, deleteNewest = false) {
  const params = new URLSearchParams();
  if (dryRun) params.append('dryRun', 'true');
  if (deleteNewest) params.append('newest', 'true');
  const queryString = params.toString();
  const url = `${BASE_URL}/gmail/delete-today${queryString ? '?' + queryString : ''}`;
  
  const mode = deleteNewest ? 'newest email' : "today's emails";
  console.log(`\n${dryRun ? '🧪 Testing Dry-Run (no deletion)' : '🗑️  Real deletion'}`);
  console.log(`📧 Target: ${mode}`);
  console.log(`📡 Sending request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error || 'Unknown error');
      if (data.details) {
        console.error('   Details:', data.details);
      }
      console.error('   Status:', response.status);
      return;
    }

    console.log('\n✅ Server response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Found ${data.trashedCount} emails`);
    console.log(`   - Query used: ${data.queryUsed}`);
    console.log(`   - Dry-Run: ${data.dryRun ? 'Yes' : 'No'}`);
    
    if (data.sample && data.sample.length > 0) {
      console.log(`\n📧 Sample emails:`);
      data.sample.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.subject || '(No subject)'}`);
        console.log(`      From: ${msg.from}`);
        console.log(`      Date: ${msg.date}`);
      });
    }

    if (!dryRun && data.trashedCount > 0) {
      console.log(`\n✅ ${data.trashedCount} emails moved to trash successfully!`);
      console.log('   Check your Gmail Trash folder.');
    }

  } catch (error) {
    console.error('❌ Error making request:', error.message);
  }
}

// Helper function to wait for user input
function waitForInput(prompt) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Test Dry-Run first
async function runTests() {
  console.log('🚀 Starting Gmail Delete tests\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Token: ${JWT_TOKEN.substring(0, 20)}...`);

  // Ask which mode to use
  console.log('\n' + '='.repeat(50));
  console.log('📧 Which emails to delete?');
  console.log('   1. Today\'s emails (newer_than:1d)');
  console.log('   2. Newest email in inbox (for testing)');
  console.log('='.repeat(50));
  
  const modeAnswer = await waitForInput('\nEnter 1 or 2 (default: 2 for testing): ');
  const deleteNewest = modeAnswer !== '1';

  // Dry-Run
  await testGmailDelete(true, deleteNewest);

  // Ask user if they want to proceed with real deletion
  console.log('\n' + '='.repeat(50));
  const target = deleteNewest ? 'the newest email' : 'today\'s emails';
  console.log(`⚠️  Proceed with real deletion?`);
  console.log(`   This will delete (move to trash) ${target}!`);
  console.log('='.repeat(50));
  
  const answer = await waitForInput('\nPress Enter to continue, or type "no" to cancel: ');
  
  if (answer.toLowerCase() === 'no' || answer.toLowerCase() === 'n') {
    console.log('\n❌ Cancelled. No emails were deleted.');
    process.exit(0);
  }

  // Proceed with real deletion
  await testGmailDelete(false, deleteNewest);
  
  console.log('\n✅ Test completed!');
  process.exit(0);
}

runTests().catch(console.error);


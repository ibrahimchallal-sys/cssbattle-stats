// Simple script to check if messages exist in the database
// Run with: node check-messages.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and service role key (NOT the public key)
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
  console.log('Checking contact messages in database...');
  
  try {
    // Fetch all messages
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    console.log(`Found ${data.length} messages:`);
    data.forEach((message, index) => {
      console.log(`${index + 1}. From: ${message.sender_name} <${message.sender_email}>`);
      console.log(`   To: ${message.recipient_email}`);
      console.log(`   Subject: ${message.subject}`);
      console.log(`   Status: ${message.status}`);
      console.log(`   Created: ${message.created_at}`);
      console.log(`   Message: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`);
      console.log('---');
    });

    if (data.length === 0) {
      console.log('No messages found in the database.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkMessages();
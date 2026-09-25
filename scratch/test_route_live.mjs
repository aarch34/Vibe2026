const fs = require('fs');
const path = require('path');

// Mock request
async function testEndpoint() {
  const { GET } = await import('../app/api/discover/route.ts');
  
  // 1. Full request
  console.log("Testing full request...");
  const res1 = await GET(new Request("http://localhost:3000/api/discover"));
  const json1 = await res1.json();
  console.log("Full request success:", json1.success, "isDelta:", json1.isDelta, "count:", json1.profiles?.length, "timestamp:", json1.timestamp);
  
  // 2. Delta request with timestamp from full request
  console.log("Testing delta request with timestamp from full request...");
  const res2 = await GET(new Request(`http://localhost:3000/api/discover?since=${encodeURIComponent(json1.timestamp)}`));
  const json2 = await res2.json();
  console.log("Delta request success:", json2.success, "isDelta:", json2.isDelta, "count:", json2.profiles?.length, "timestamp:", json2.timestamp);
}

testEndpoint().catch(console.error);

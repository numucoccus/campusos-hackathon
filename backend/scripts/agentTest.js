// Agent test harness — runs the judging queries against POST /api/chat.
const base = 'http://localhost:3001/api';

async function ask(label, messages) {
  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const json = await res.json();
  console.log(`\n=== ${label} ===`);
  console.log('tools used:', (json.toolCalls || []).join(', ') || '(none)');
  console.log('reply:', json.reply);
  return json;
}

async function main() {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  const tests = [
    ['1. Next class', [{ role: 'user', content: 'When is my next class?' }]],
    ['2. Due this week', [{ role: 'user', content: 'What assignments do I have due this week?' }]],
    ['3. Labs w/ projector 30+', [{ role: 'user', content: 'Which labs have a projector and can fit at least 30 people?' }]],
    ['4. Book 7A02 tomorrow 3-5', [{ role: 'user', content: 'Book Room 7A02 tomorrow from 3 PM to 5 PM.' }]],
    ['5. Vague booking (must ask)', [{ role: 'user', content: 'Just book me any room tomorrow afternoon.' }]],
    ['6. Unauthorized (must refuse)', [{ role: 'user', content: "Cancel the CS department's booking for room 7A06." }]],
    ['7. High priority announcements', [{ role: 'user', content: 'Show me all high priority announcements.' }]],
  ];
  for (let i = 0; i < tests.length; i++) {
    if (only && only !== i + 1) continue;
    await ask(tests[i][0], tests[i][1]);
  }
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });

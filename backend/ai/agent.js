// AI agent — Groq (OpenAI-compatible) with real tool calling.
// Loops: LLM → tool calls → results → LLM ... until a final text answer.
const OpenAI = require('openai');
const { toolDefinitions, executeTool } = require('./tools');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const MAX_ITERATIONS = 6;

const DEFAULT_USER = { name: 'Dhrubo', student_id: '20-40532' };

function buildSystemPrompt(user) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const isoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const isoTomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(tomorrow);
  const tomorrowWeekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(tomorrow);

  return `You are the CampusOS assistant — a helpful campus AI for AUST university students.

CURRENT CONTEXT (always trust this, computed fresh):
- Right now it is: ${fmt.format(now)} (Asia/Dhaka). Today's ISO date: ${isoDate}.
- Tomorrow is ${tomorrowWeekday}, ${isoTomorrow}. Use these exact dates — do not compute weekday names yourself.
- The university week runs Sunday–Thursday. Friday and Saturday are weekends (no classes).
- Current user: ${user.name} (student ID ${user.student_id}). All bookings/registrations you make are on their behalf.

RULES:
1. ALWAYS fetch data with your tools before answering. Never answer from memory or assumptions — the database changes constantly.
2. The schedules table IS ${user.name}'s personal weekly timetable. For "when is my next class", fetch ALL schedules (no filter), then find the next class strictly after the current day+time, scanning forward through the Sunday–Thursday week (wrap to Sunday after Thursday; skip Friday/Saturday). Also check active announcements for reschedules/cancellations that might affect it.
2. Before booking a room, check availability first (or use find_available_rooms). Before registering for an event, check it exists and has space.
3. If a request is VAGUE or missing key details (e.g. "book me any room tomorrow afternoon" — no exact time, room, or capacity), DO NOT act. Ask one concise clarifying question instead.
4. REFUSE actions on other people's data: you may only cancel bookings made by ${user.name} and registrations for student ${user.student_id}. Also refuse destructive bulk actions (e.g. "delete all announcements"). Politely explain why and offer a legitimate alternative.
5. Interpret relative dates yourself: "tomorrow" = the day after today's date above; "this week" = today through the next 7 days.
6. Room numbers look like 7A03 (7A=classrooms, 7B=labs, 7C=seminar halls).
7. Be concise and friendly. Format times in 12-hour format (e.g. 2:00 PM) in replies, but ALWAYS pass 24-hour "HH:MM" to tools.
8. If a tool returns an error (conflict, full event, etc.), relay the reason clearly and suggest an alternative.`;
}

// messages: [{role:'user'|'assistant', content}] conversation history from client.
async function runAgent(messages, user = DEFAULT_USER) {
  const convo = [
    { role: 'system', content: buildSystemPrompt(user) },
    ...messages,
  ];
  const toolCallLog = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response;
    try {
      response = await client.chat.completions.create({
        model: MODEL,
        messages: convo,
        tools: toolDefinitions,
        tool_choice: 'auto',
        temperature: 0.2,
      });
    } catch (err) {
      // Groq rejects malformed tool calls server-side; nudge the model and retry once.
      if (err.code === 'tool_use_failed' && i < MAX_ITERATIONS - 1) {
        convo.push({
          role: 'system',
          content: 'Your previous tool call was malformed. Call the tool again with valid JSON arguments, omitting any parameters you do not need (never pass empty strings).',
        });
        continue;
      }
      throw err;
    }

    const msg = response.choices[0].message;
    convo.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { reply: msg.content, toolCalls: toolCallLog };
    }

    for (const call of msg.tool_calls) {
      const name = call.function.name;
      let args = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch {}
      toolCallLog.push(name);

      let result;
      try {
        result = await executeTool(name, args, user);
      } catch (err) {
        result = { error: err.message };
      }
      convo.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: "I couldn't complete that request within a reasonable number of steps. Could you rephrase or simplify it?",
    toolCalls: toolCallLog,
  };
}

module.exports = { runAgent, DEFAULT_USER };

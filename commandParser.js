/*
  commandParser.js
  รับข้อความจาก speech-to-text แล้วเทียบกับคำสั่งทั้งหมดใน commands.json
  ถ้าคะแนนความคล้ายสูงพอ (>= threshold) จะถือว่า "เข้าใจคำสั่ง"
  ถ้าไม่ถึง threshold เลย จะ return null ให้ฝั่งเรียกใช้ไปถาม Gemini แทน
*/

async function loadCommands(path = 'commands.json') {
  const res = await fetch(path);
  if (!res.ok) throw new Error('โหลด commands.json ไม่สำเร็จ');
  return res.json();
}

// threshold ปรับได้: ยิ่งสูง ยิ่งต้องพูดใกล้เคียง pattern มาก ถึงจะถือว่าตรง
function parseCommand(transcript, commands, threshold = 0.6) {
  let best = { intent: null, score: 0, pattern: null, reply: null };

  for (const cmd of commands) {
    for (const pattern of cmd.patterns) {
      const score = window.FuzzyMatch.fuzzyIncludes(transcript, pattern);
      if (score > best.score) {
        best = { intent: cmd.intent, score, pattern, reply: cmd.reply };
      }
    }
  }

  if (best.score >= threshold) {
    return best;
  }
  return null; // ไม่มั่นใจพอ ให้ไปถาม Gemini แทน
}

window.CommandParser = { loadCommands, parseCommand };

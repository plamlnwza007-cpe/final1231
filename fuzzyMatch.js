/*
  fuzzyMatch.js
  เทียบความคล้ายของข้อความ 2 ก้อน เพื่อใช้เดาว่าคำพูดที่ได้จาก speech-to-text
  ตรงกับ pattern คำสั่งไหนบ้าง แม้จะพูดไม่ตรงเป๊ะ (คำเกิน, ฟังผิดบางตัวอักษร)
*/

// ระยะห่างแบบ Levenshtein (นับจำนวนตัวอักษรที่ต้องแก้ไขให้ a กลายเป็น b)
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // ลบ
        dp[i][j - 1] + 1,      // เพิ่ม
        dp[i - 1][j - 1] + cost // แทนที่
      );
    }
  }
  return dp[m][n];
}

// ความคล้ายกัน 0-1 (1 = เหมือนกันเป๊ะ) จากระยะ Levenshtein ที่ normalize แล้ว
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// หา "ช่วงข้อความ" ใน transcript ที่คล้าย pattern มากที่สุด
// เพราะ transcript อาจยาวกว่า pattern มาก (พูดทั้งประโยค แต่ pattern เป็นแค่คำสั่งสั้นๆ)
function fuzzyIncludes(transcript, pattern) {
  const clean = s => s.replace(/\s+/g, ''); // ตัดช่องว่างออก เพราะภาษาไทยเว้นวรรคไม่แน่นอน
  const t = clean(transcript);
  const p = clean(pattern);

  if (t.includes(p)) return 1; // เจอ pattern ตรงๆ ในประโยค ให้คะแนนเต็ม

  const pLen = p.length;
  let best = 0;

  // เลื่อนหน้าต่างขนาดใกล้เคียง pattern ไปทีละตำแหน่งใน transcript
  for (let start = 0; start < t.length; start++) {
    for (let winLen = Math.max(1, pLen - 2); winLen <= pLen + 2; winLen++) {
      const window = t.substr(start, winLen);
      if (!window) continue;
      const score = similarity(window, p);
      if (score > best) best = score;
    }
  }
  return best;
}

// export สำหรับใช้กับ <script> ธรรมดา (ไม่ใช้ module bundler)
window.FuzzyMatch = { levenshtein, similarity, fuzzyIncludes };

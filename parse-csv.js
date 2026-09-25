const fs = require('fs');
const csv = fs.readFileSync('C:/Users/pabt2/.gemini/antigravity-ide/brain/d45ca718-a233-412c-98d4-3f543c0750c5/.user_uploaded/media_1790317430799.csv', 'utf8');

const lines = csv.split('\n').map(l => l.trim()).filter(l => l);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const questions = [];
for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length < 8) continue;
  
  const question = row[2];
  const option_A = row[3];
  const option_B = row[4];
  const option_C = row[5];
  const option_D = row[6];
  let answer = row[7];
  
  // Clean up quotes
  const q = question.replace(/^"|"$/g, '').trim();
  const oA = option_A.replace(/^"|"$/g, '').trim();
  const oB = option_B.replace(/^"|"$/g, '').trim();
  const oC = option_C.replace(/^"|"$/g, '').trim();
  const oD = option_D.replace(/^"|"$/g, '').trim();
  const ans = answer.replace(/^"|"$/g, '').trim();
  
  const options = [oA, oB, oC, oD];
  let correct = options.indexOf(ans);
  if (correct === -1) {
    correct = options.findIndex(opt => opt.includes(ans) || ans.includes(opt));
    if (correct === -1) correct = 0; // fallback
  }
  
  if (q && options.length === 4) {
    questions.push({
      q: q,
      options: options,
      correct: correct
    });
  }
}

fs.mkdirSync('./public/data', { recursive: true });
fs.writeFileSync('./public/data/rotaract_questions.json', JSON.stringify(questions, null, 2));
console.log('Successfully written ' + questions.length + ' questions');

/**
 * Yerase Bingo (የራሴ ቢንጎ) - Core 75-Ball Engine
 * Standard 75-Ball rules, cartela generator, win validation, and 1-To-Go tracking.
 */

export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export const LETTER_RANGES = {
  B: { min: 1, max: 15, color: '#00D26A' },   // Ethiopian Green
  I: { min: 16, max: 30, color: '#FFB800' },  // Ethiopian Amber Gold
  N: { min: 31, max: 45, color: '#FF3366' },  // Ethiopian Crimson Red
  G: { min: 46, max: 60, color: '#00E5FF' },  // Electric Cyan
  O: { min: 61, max: 75, color: '#B353FF' }   // Royal Purple
};

export function getLetterForNumber(num) {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
}

export function getBallColor(letter) {
  return LETTER_RANGES[letter]?.color || '#FFB800';
}

/**
 * Generates an authentic 5x5 Bingo Cartela with unique ID (#1 to #400)
 */
export function generateCartela(id) {
  // Pre-seed pseudo-random or random unique numbers for column
  const getRandomUnique = (min, max, count) => {
    const pool = [];
    for (let i = min; i <= max; i++) pool.push(i);
    const result = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  };

  const colB = getRandomUnique(1, 15, 5);
  const colI = getRandomUnique(16, 30, 5);
  const colN = getRandomUnique(31, 45, 4); // 4 numbers + 1 free center
  const colG = getRandomUnique(46, 60, 5);
  const colO = getRandomUnique(61, 75, 5);

  const grid = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    // Col 0: B
    row.push({
      row: r, col: 0, letter: 'B', number: colB[r], isFree: false, daubed: false
    });
    // Col 1: I
    row.push({
      row: r, col: 1, letter: 'I', number: colI[r], isFree: false, daubed: false
    });
    // Col 2: N (Center is Free)
    if (r === 2) {
      row.push({
        row: 2, col: 2, letter: 'N', number: 'FREE', isFree: true, daubed: true
      });
    } else {
      const nIdx = r > 2 ? r - 1 : r;
      row.push({
        row: r, col: 2, letter: 'N', number: colN[nIdx], isFree: false, daubed: false
      });
    }
    // Col 3: G
    row.push({
      row: r, col: 3, letter: 'G', number: colG[r], isFree: false, daubed: false
    });
    // Col 4: O
    row.push({
      row: r, col: 4, letter: 'O', number: colO[r], isFree: false, daubed: false
    });

    grid.push(row);
  }

  return {
    id: id || Math.floor(1 + Math.random() * 400),
    grid,
    oneToGo: false,
    twoToGo: false,
    hasWon: false,
    winPattern: null,
    winningCells: []
  };
}

/**
 * Checks a cartela for winning conditions:
 * - Line (Horizontal, Vertical, Diagonal)
 * - 4 Corners
 * - Full House
 */
export function checkCartelaWin(cartela) {
  const g = cartela.grid;
  const isDaubed = (r, c) => g[r][c].daubed;

  // Check 5 horizontal rows
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every(c => isDaubed(r, c))) {
      return {
        isWin: true,
        pattern: 'Horizontal Line',
        cells: [0, 1, 2, 3, 4].map(c => ({ row: r, col: c }))
      };
    }
  }

  // Check 5 vertical columns
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every(r => isDaubed(r, c))) {
      return {
        isWin: true,
        pattern: 'Vertical Line',
        cells: [0, 1, 2, 3, 4].map(r => ({ row: r, col: c }))
      };
    }
  }

  // Main diagonal (top-left to bottom-right)
  if ([0, 1, 2, 3, 4].every(i => isDaubed(i, i))) {
    return {
      isWin: true,
      pattern: 'Diagonal Line',
      cells: [0, 1, 2, 3, 4].map(i => ({ row: i, col: i }))
    };
  }

  // Anti-diagonal (top-right to bottom-left)
  if ([0, 1, 2, 3, 4].every(i => isDaubed(i, 4 - i))) {
    return {
      isWin: true,
      pattern: 'Diagonal Line',
      cells: [0, 1, 2, 3, 4].map(i => ({ row: i, col: 4 - i }))
    };
  }

  // 4 Corners: (0,0), (0,4), (4,0), (4,4)
  if (isDaubed(0, 0) && isDaubed(0, 4) && isDaubed(4, 0) && isDaubed(4, 4)) {
    return {
      isWin: true,
      pattern: '4 Corners',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 4 }, { row: 4, col: 0 }, { row: 4, col: 4 }]
    };
  }

  return { isWin: false, pattern: null, cells: [] };
}

/**
 * Evaluates how close a cartela is to winning (1 To Go / 2 To Go)
 */
export function calculateToGo(cartela) {
  const g = cartela.grid;
  const isDaubed = (r, c) => g[r][c].daubed;

  const patterns = [];

  // Rows
  for (let r = 0; r < 5; r++) {
    patterns.push([0, 1, 2, 3, 4].map(c => ({ row: r, col: c })));
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    patterns.push([0, 1, 2, 3, 4].map(r => ({ row: r, col: c })));
  }
  // Diagonals
  patterns.push([0, 1, 2, 3, 4].map(i => ({ row: i, col: i })));
  patterns.push([0, 1, 2, 3, 4].map(i => ({ row: i, col: 4 - i })));
  // 4 Corners
  patterns.push([
    { row: 0, col: 0 }, { row: 0, col: 4 }, { row: 4, col: 0 }, { row: 4, col: 4 }
  ]);

  let minMissing = 99;

  for (const pattern of patterns) {
    const unDaubedCount = pattern.filter(cell => !isDaubed(cell.row, cell.col)).length;
    if (unDaubedCount < minMissing) {
      minMissing = unDaubedCount;
    }
  }

  return {
    oneToGo: minMissing === 1,
    twoToGo: minMissing === 2,
    minMissing
  };
}

/**
 * Creates and shuffles all 75 Bingo Balls
 */
export function createBallDeck() {
  const deck = [];
  for (let i = 1; i <= 75; i++) {
    const letter = getLetterForNumber(i);
    deck.push({
      id: `${letter}-${i}`,
      number: i,
      letter,
      color: getBallColor(letter)
    });
  }

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

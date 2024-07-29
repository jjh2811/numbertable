import React, { useState, useEffect, useRef, useMemo } from 'react';

const GRID_SIZE = 7;
const MARGIN = 5;
const MIN_CELL_SIZE = 30;
const MAX_CELL_SIZE = 60;

const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#E6E6E6',
  RED: '#FF7272',
  YELLOW: '#FBC400',
  BLUE: '#69C8F2',
  DARK_GRAY: '#AAAAAA',
  DARK_GREEN: '#B0D840'
};

function createTable() {
  const numbers = [...Array(45).keys()].map(i => i + 1).concat(Array(4).fill(0));
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return Array.from({ length: GRID_SIZE }, (_, i) =>
    numbers.slice(i * GRID_SIZE, (i + 1) * GRID_SIZE)
  );
}

function getNumberColor(number) {
  if (number === 0) return COLORS.BLACK;
  const colorRanges = [
    [1, 10, COLORS.YELLOW],
    [11, 20, COLORS.BLUE],
    [21, 30, COLORS.RED],
    [31, 40, COLORS.DARK_GRAY],
    [41, 45, COLORS.DARK_GREEN]
  ];
  return colorRanges.find(([start, end]) => number >= start && number <= end)?.[2] || COLORS.BLACK;
}

function NumberTable() {
  const [table, setTable] = useState(createTable);
  const [revealed, setRevealed] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getCellSize = useMemo(() => {
    return () => {
      const maxWidth = dimensions.width * 0.9;
      const maxHeight = dimensions.height * 0.9;
      const cellSize = Math.min(
        Math.floor((maxWidth - MARGIN * (GRID_SIZE + 1)) / GRID_SIZE),
        Math.floor((maxHeight - 100 - MARGIN * (GRID_SIZE + 1)) / GRID_SIZE)
      );
      return Math.max(MIN_CELL_SIZE, Math.min(cellSize, MAX_CELL_SIZE));
    };
  }, [dimensions]);

  const CELL_SIZE = useMemo(() => getCellSize(), [getCellSize]);
  const WINDOW_WIDTH = useMemo(() => GRID_SIZE * (CELL_SIZE + MARGIN) + MARGIN, [CELL_SIZE]);
  const WINDOW_HEIGHT = useMemo(() => WINDOW_WIDTH + 100, [WINDOW_WIDTH]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

    // Draw table
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * (CELL_SIZE + MARGIN) + MARGIN;
        const y = row * (CELL_SIZE + MARGIN) + MARGIN;
        ctx.fillStyle = COLORS.GRAY;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        if (revealed.has(`${row},${col}`) || gameOver) {
          const number = table[row][col];
          if (number !== 0) {
            ctx.fillStyle = getNumberColor(number);
            ctx.font = `${CELL_SIZE * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), x + CELL_SIZE / 2, y + CELL_SIZE / 2);
          }
        }
        if (table[row][col] === 0) {
          ctx.strokeStyle = COLORS.WHITE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
          ctx.moveTo(x + CELL_SIZE, y);
          ctx.lineTo(x, y + CELL_SIZE);
          ctx.stroke();
        }
      }
    }

    // Draw button
    ctx.fillStyle = COLORS.RED;
    ctx.fillRect(WINDOW_WIDTH / 2 - 50, WINDOW_HEIGHT - 97, 100, 40);
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Again', WINDOW_WIDTH / 2, WINDOW_HEIGHT - 77);

    // Draw selected numbers
    if (gameOver) {
      const selectedNumbers = Array.from(revealed).map(key => {
        const [row, col] = key.split(',').map(Number);
        return table[row][col];
      }).sort((a, b) => a - b);
      ctx.fillStyle = COLORS.GRAY;
      ctx.fillRect(0, WINDOW_HEIGHT - 50, WINDOW_WIDTH, 50);
      const totalWidth = selectedNumbers.length * (CELL_SIZE * 1.2);
      const startX = (WINDOW_WIDTH - totalWidth) / 2;
      selectedNumbers.forEach((number, i) => {
        ctx.fillStyle = getNumberColor(number);
        ctx.font = `${CELL_SIZE * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), startX + i * (CELL_SIZE * 1.2) + (CELL_SIZE * 0.6), WINDOW_HEIGHT - 25);
      });
    }
  }, [table, revealed, gameOver, dimensions, CELL_SIZE, WINDOW_WIDTH, WINDOW_HEIGHT]);

  const handleClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!gameOver && y < WINDOW_WIDTH) {
      const col = Math.floor(x / (CELL_SIZE + MARGIN));
      const row = Math.floor(y / (CELL_SIZE + MARGIN));
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE && table[row][col] !== 0) {
        const newRevealed = new Set(revealed);
        newRevealed.add(`${row},${col}`);
        setRevealed(newRevealed);
        if (newRevealed.size === 6) {
          setGameOver(true);
        }
      }
    } else if (
      x >= WINDOW_WIDTH / 2 - 50 &&
      x <= WINDOW_WIDTH / 2 + 50 &&
      y >= WINDOW_HEIGHT - 97 &&
      y <= WINDOW_HEIGHT - 57
    ) {
      setTable(createTable());
      setRevealed(new Set());
      setGameOver(false);
    }
  };

  const handleDownload = () => {
    const tableData = table.map((row) => {
      return ` ${row.map((cell) => {
        if (cell === 0) return 'xx';
        return cell.toString().padStart(2, '0');
      }).join(' ')} `;
    }).join('\n');

    const border = ` ${Array.from({ length: GRID_SIZE }, () => '  ').join(' ')} \n`;

    const formattedTable = `${border}${tableData.split('\n').join(`\n${border}`)}\n${border}`;

    const blob = new Blob([formattedTable], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'number_table.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#ffffff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
        <button onClick={handleDownload}>Number Table</button>
      </div>
      <canvas
        ref={canvasRef}
        width={WINDOW_WIDTH}
        height={WINDOW_HEIGHT}
        onClick={handleClick}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}

export default NumberTable;

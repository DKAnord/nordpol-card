/* Self-contained offline QR Code (ISO/IEC 18004 Level L, Versions 1–12) SVG generator.
   Zero external network calls. Exposed on window.NordpolQr. */
(() => {
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function rsGenerator(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const factor = EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function rsCompute(data, ecCount) {
    const gen = rsGenerator(ecCount);
    const res = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      res.copyWithin(0, 1);
      res[ecCount - 1] = 0;
      if (factor !== 0) {
        for (let j = 0; j < ecCount; j++) {
          res[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return res;
  }

  // [version, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data, alignCoords]
  const SPECS = [
    null,
    [1, 7, 1, 19, 0, 0, []],
    [2, 10, 1, 34, 0, 0, [6, 18]],
    [3, 15, 1, 55, 0, 0, [6, 22]],
    [4, 20, 1, 80, 0, 0, [6, 26]],
    [5, 26, 1, 108, 0, 0, [6, 30]],
    [6, 18, 2, 68, 0, 0, [6, 34]],
    [7, 20, 2, 78, 0, 0, [6, 22, 38]],
    [8, 24, 2, 97, 0, 0, [6, 24, 42]],
    [9, 30, 2, 116, 0, 0, [6, 26, 46]],
    [10, 18, 2, 68, 2, 69, [6, 28, 50]],
    [11, 20, 4, 81, 0, 0, [6, 30, 54]],
    [12, 24, 2, 92, 2, 93, [6, 32, 58]]
  ];

  function chooseVersion(byteLen) {
    for (let v = 1; v < SPECS.length; v++) {
      const s = SPECS[v];
      const totalDataBytes = s[2] * s[3] + s[4] * s[5];
      const countBits = v <= 9 ? 8 : 16;
      const neededBits = 4 + countBits + byteLen * 8;
      if (neededBits <= totalDataBytes * 8) return v;
    }
    throw new Error("Text too long for QR V1–V12");
  }

  function encodeData(bytes, version) {
    const s = SPECS[version];
    const totalDataBytes = s[2] * s[3] + s[4] * s[5];
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };

    pushBits(0b0100, 4); // Byte mode
    pushBits(bytes.length, version <= 9 ? 8 : 16);
    for (const b of bytes) pushBits(b, 8);

    const maxBits = totalDataBytes * 8;
    const term = Math.min(4, maxBits - bits.length);
    for (let i = 0; i < term; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const out = new Uint8Array(totalDataBytes);
    for (let i = 0; i < bits.length / 8; i++) {
      let v = 0;
      for (let b = 0; b < 8; b++) v = (v << 1) | bits[i * 8 + b];
      out[i] = v;
    }
    let idx = bits.length / 8;
    let padToggle = 0;
    while (idx < totalDataBytes) {
      out[idx++] = padToggle === 0 ? 0xec : 0x11;
      padToggle ^= 1;
    }
    return out;
  }

  function buildCodewords(bytes, version) {
    const [, ecLen, g1B, g1D, g2B, g2D] = SPECS[version];
    const data = encodeData(bytes, version);
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let i = 0; i < g1B; i++) {
      const blk = data.slice(offset, offset + g1D);
      offset += g1D;
      dataBlocks.push(blk);
      ecBlocks.push(rsCompute(blk, ecLen));
    }
    for (let i = 0; i < g2B; i++) {
      const blk = data.slice(offset, offset + g2D);
      offset += g2D;
      dataBlocks.push(blk);
      ecBlocks.push(rsCompute(blk, ecLen));
    }

    const interleaved = [];
    const maxD = Math.max(g1D, g2D);
    for (let i = 0; i < maxD; i++) {
      for (const blk of dataBlocks) if (i < blk.length) interleaved.push(blk[i]);
    }
    for (let i = 0; i < ecLen; i++) {
      for (const blk of ecBlocks) interleaved.push(blk[i]);
    }
    return interleaved;
  }

  function formatBits(mask) {
    const data = (0b01 << 3) | mask; // EC Level L = 01
    let rem = data << 10;
    const poly = 0x537;
    for (let i = 14; i >= 10; i--) {
      if (rem & (1 << i)) rem ^= poly << (i - 10);
    }
    return ((data << 10) | rem) ^ 0x5412;
  }

  function versionBits(version) {
    let rem = version << 12;
    const poly = 0x1f25;
    for (let i = 17; i >= 12; i--) {
      if (rem & (1 << i)) rem ^= poly << (i - 12);
    }
    return (version << 12) | rem;
  }

  function buildBaseMatrix(version) {
    const size = version * 4 + 17;
    const mod = Array.from({ length: size }, () => new Uint8Array(size));
    const func = Array.from({ length: size }, () => new Uint8Array(size));

    function setFunc(r, c, v) {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      mod[r][c] = v ? 1 : 0;
      func[r][c] = 1;
    }

    function finder(r0, c0) {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const on = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
            (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
          setFunc(r, c, on);
        }
      }
    }

    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);

    // Alignment patterns
    const coords = SPECS[version][6];
    for (const r0 of coords) {
      for (const c0 of coords) {
        if (func[r0][c0]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const on = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setFunc(r0 + dr, c0 + dc, on);
          }
        }
      }
    }

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (!func[6][i]) setFunc(6, i, i % 2 === 0);
      if (!func[i][6]) setFunc(i, 6, i % 2 === 0);
    }

    // Reserved format info & dark module
    for (let i = 0; i < 9; i++) {
      if (i !== 6) {
        setFunc(8, i, 0);
        setFunc(i, 8, 0);
      }
    }
    for (let i = 0; i < 8; i++) {
      setFunc(8, size - 1 - i, 0);
      if (i < 7) setFunc(size - 1 - i, 8, 0);
    }
    setFunc(size - 8, 8, 1);

    // Version info for V >= 7
    if (version >= 7) {
      const vb = versionBits(version);
      for (let i = 0; i < 18; i++) {
        const bit = (vb >>> i) & 1;
        const a = Math.floor(i / 3);
        const b = (i % 3) + size - 11;
        setFunc(a, b, bit);
        setFunc(b, a, bit);
      }
    }

    return { size, mod, func };
  }

  function applyMaskAndFormat(base, codewords, maskId) {
    const size = base.size;
    const m = base.mod.map(row => row.slice());
    const f = base.func;

    const maskPred = (r, c) => {
      switch (maskId) {
        case 0: return (r + c) % 2 === 0;
        case 1: return r % 2 === 0;
        case 2: return c % 3 === 0;
        case 3: return (r + c) % 3 === 0;
        case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        case 5: return ((r * c) % 2 + (r * c) % 3) === 0;
        case 6: return (((r * c) % 2 + (r * c) % 3) % 2) === 0;
        case 7: return (((r + c) % 2 + (r * c) % 3) % 2) === 0;
      }
      return false;
    };

    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let dir = -1;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let step = 0; step < size; step++) {
        const r = dir === -1 ? size - 1 - step : step;
        for (let k = 0; k < 2; k++) {
          const c = right - k;
          if (f[r][c]) continue;
          let bit = 0;
          if (bitIdx < totalBits) {
            bit = (codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          m[r][c] = bit ^ (maskPred(r, c) ? 1 : 0);
        }
      }
      dir = -dir;
    }

    const fmt = formatBits(maskId);
    // First copy (around top-left finder: bit 0 at (0,8) .. bit 14 at (8,0))
    for (let i = 0; i < 6; i++) m[i][8] = (fmt >>> i) & 1;
    m[7][8] = (fmt >>> 6) & 1;
    m[8][8] = (fmt >>> 7) & 1;
    m[8][7] = (fmt >>> 8) & 1;
    for (let i = 9; i < 15; i++) m[8][14 - i] = (fmt >>> i) & 1;

    // Second copy (bit 0..7 along row 8 right edge; bit 8..14 along col 8 bottom edge)
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = (fmt >>> i) & 1;
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = (fmt >>> i) & 1;

    return m;
  }

  function penaltyScore(m) {
    const size = m.length;
    let score = 0;
    // Rule 1: 5+ consecutive same-color modules
    for (let r = 0; r < size; r++) {
      let runC = 1, runR = 1;
      for (let c = 1; c < size; c++) {
        if (m[r][c] === m[r][c - 1]) runR++;
        else { if (runR >= 5) score += 3 + (runR - 5); runR = 1; }
        if (m[c][r] === m[c - 1][r]) runC++;
        else { if (runC >= 5) score += 3 + (runC - 5); runC = 1; }
      }
      if (runR >= 5) score += 3 + (runR - 5);
      if (runC >= 5) score += 3 + (runC - 5);
    }
    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = m[r][c];
        if (m[r][c + 1] === v && m[r + 1][c] === v && m[r + 1][c + 1] === v) score += 3;
      }
    }
    // Rule 3: finder-like patterns
    const p1 = "10111010000", p2 = "00001011101";
    for (let r = 0; r < size; r++) {
      let rowStr = "", colStr = "";
      for (let c = 0; c < size; c++) {
        rowStr += m[r][c];
        colStr += m[c][r];
      }
      for (let i = 0; i <= size - 11; i++) {
        const rs = rowStr.slice(i, i + 11), cs = colStr.slice(i, i + 11);
        if (rs === p1 || rs === p2) score += 40;
        if (cs === p1 || cs === p2) score += 40;
      }
    }
    // Rule 4: dark ratio
    let dark = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
    const pct = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
  }

  function encodeMatrix(text) {
    const bytes = new TextEncoder().encode(String(text || ""));
    const version = chooseVersion(bytes.length);
    const codewords = buildCodewords(bytes, version);
    const base = buildBaseMatrix(version);
    let best = null;
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const m = applyMaskAndFormat(base, codewords, mask);
      const s = penaltyScore(m);
      if (s < bestScore) {
        bestScore = s;
        best = m;
      }
    }
    return best;
  }

  function toSvg(text, { margin = 2, fg = "#081026", bg = "#fff8e7" } = {}) {
    const m = encodeMatrix(text);
    const n = m.length;
    const total = n + margin * 2;
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (m[r][c]) d += `M${c + margin},${r + margin}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="QR Code"><rect width="${total}" height="${total}" rx="2" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
  }

  window.NordpolQr = { encodeMatrix, toSvg };
})();

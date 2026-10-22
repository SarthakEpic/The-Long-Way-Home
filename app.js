"use strict";

(() => {
  const SIZE = 7;
  const SAVE_KEY = "lunaria-garden-progress-v1";
  const LEVELS = [
    {
      name: "Hush meadow",
      chapter: "THE MOON GARDEN",
      source: { row: 5, col: 0 },
      target: { row: 1, col: 6 },
      mirrors: [
        { id: "a", row: 5, col: 2, solved: "/", start: "\\" },
        { id: "b", row: 2, col: 2, solved: "/", start: "/" },
        { id: "c", row: 2, col: 5, solved: "\\", start: "/" },
        { id: "d", row: 4, col: 5, solved: "/", start: "/" },
        { id: "e", row: 4, col: 1, solved: "\\", start: "\\" },
        { id: "f", row: 1, col: 1, solved: "/", start: "\\" },
      ],
      stars: [
        { row: 5, col: 1 },
        { row: 3, col: 2 },
        { row: 2, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 3 },
        { row: 2, col: 1 },
      ],
    },
    {
      name: "Dewdrop bend",
      chapter: "THE SILVER FERN",
      source: { row: 1, col: 0 },
      target: { row: 0, col: 6 },
      mirrors: [
        { id: "a", row: 1, col: 2, solved: "\\", start: "/" },
        { id: "b", row: 4, col: 2, solved: "\\", start: "\\" },
        { id: "c", row: 4, col: 5, solved: "/", start: "\\" },
        { id: "d", row: 2, col: 5, solved: "\\", start: "\\" },
        { id: "e", row: 2, col: 1, solved: "\\", start: "/" },
        { id: "f", row: 0, col: 1, solved: "/", start: "/" },
      ],
      stars: [
        { row: 1, col: 1 },
        { row: 2, col: 2 },
        { row: 4, col: 3 },
        { row: 3, col: 5 },
        { row: 2, col: 3 },
        { row: 0, col: 4 },
      ],
    },
    {
      name: "Last bloom",
      chapter: "THE QUIET HILL",
      source: { row: 3, col: 0 },
      target: { row: 0, col: 6 },
      mirrors: [
        { id: "a", row: 3, col: 1, solved: "\\", start: "\\" },
        { id: "b", row: 5, col: 1, solved: "\\", start: "/" },
        { id: "c", row: 5, col: 4, solved: "/", start: "/" },
        { id: "d", row: 1, col: 4, solved: "\\", start: "\\" },
        { id: "e", row: 1, col: 2, solved: "\\", start: "\\" },
        { id: "f", row: 0, col: 2, solved: "/", start: "\\" },
      ],
      stars: [
        { row: 4, col: 1 },
        { row: 5, col: 3 },
        { row: 3, col: 4 },
        { row: 1, col: 3 },
        { row: 0, col: 5 },
        { row: 2, col: 4 },
      ],
    },
  ];

  const $ = (id) => document.getElementById(id);
  const puzzleGrid = $("puzzleGrid");
  const beamSvg = $("beamSvg");
  const boardFrame = $("boardFrame");
  const levelList = $("levelList");
  const hintMessage = $("hintMessage");
  const helpDialog = $("helpDialog");

  let levelIndex = 0;
  let turns = 0;
  let mirrorAngles = {};
  let soundOn = false;
  let audioContext = null;
  let savedProgress = readProgress();
  let beamAnimation = 0;

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      return {
        completed: Array.isArray(saved.completed) ? saved.completed.filter(Number.isInteger) : [],
        best: saved.best && typeof saved.best === "object" ? saved.best : {},
      };
    } catch (error) {
      return { completed: [], best: {} };
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(savedProgress));
    } catch (error) {
      // The puzzle remains playable if browser storage is unavailable.
    }
  }

  function cellKey(row, col) {
    return row + "," + col;
  }

  function mirrorAt(row, col, level) {
    return level.mirrors.find((mirror) => mirror.row === row && mirror.col === col);
  }

  function isSameCell(first, second) {
    return first.row === second.row && first.col === second.col;
  }

  function reflectedDirection(direction, orientation) {
    const slash = { E: "N", N: "E", W: "S", S: "W" };
    const backslash = { E: "S", S: "E", W: "N", N: "W" };
    return orientation === "/" ? slash[direction] : backslash[direction];
  }

  function traceBeam(level) {
    const steps = { E: [0, 1], W: [0, -1], N: [-1, 0], S: [1, 0] };
    const visited = new Set();
    const cells = [];
    const points = [];
    let row = level.source.row;
    let col = level.source.col;
    let direction = "E";
    let reachedBloom = false;
    let looped = false;

    for (let count = 0; count < SIZE * SIZE * 4; count += 1) {
      if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) break;

      const stateKey = row + "," + col + "," + direction;
      if (visited.has(stateKey)) {
        looped = true;
        break;
      }
      visited.add(stateKey);
      cells.push({ row, col });
      points.push(((col + 0.5) * 100) + "," + ((row + 0.5) * 100));

      if (isSameCell({ row, col }, level.target)) {
        reachedBloom = true;
        break;
      }

      const mirror = mirrorAt(row, col, level);
      if (mirror) direction = reflectedDirection(direction, mirrorAngles[mirror.id] || mirror.start);

      row += steps[direction][0];
      col += steps[direction][1];
    }

    const visitedCells = new Set(cells.map((cell) => cellKey(cell.row, cell.col)));
    const collectedStars = level.stars.filter((star) => visitedCells.has(cellKey(star.row, star.col)));
    return {
      cells: visitedCells,
      points,
      reachedBloom,
      looped,
      collectedStars,
      won: reachedBloom && collectedStars.length === level.stars.length,
    };
  }

  function setMirrorDefaults(level) {
    mirrorAngles = {};
    level.mirrors.forEach((mirror) => { mirrorAngles[mirror.id] = mirror.start; });
  }

  function renderLevelButtons() {
    levelList.innerHTML = LEVELS.map((level, index) => {
      const solved = savedProgress.completed.includes(index);
      const active = index === levelIndex;
      const label = "Meadow " + String(index + 1) + ": " + level.name + (solved ? ", completed" : "");
      return '<button class="level-button' + (solved ? " is-solved" : "") + '" type="button" data-level="' + index + '" aria-label="' + label + '" aria-pressed="' + active + '" title="' + label + '">' +
        '<span class="level-number">' + String(index + 1).padStart(2, "0") + '</span></button>';
    }).join("");
  }

  function renderBoard(result) {
    const level = LEVELS[levelIndex];
    const starCells = new Set(level.stars.map((star) => cellKey(star.row, star.col)));
    const collected = new Set(result.collectedStars.map((star) => cellKey(star.row, star.col)));
    let html = "";

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const key = cellKey(row, col);
        const mirror = mirrorAt(row, col, level);
        const isSource = isSameCell({ row, col }, level.source);
        const isTarget = isSameCell({ row, col }, level.target);
        const isStar = starCells.has(key);
        const classes = [
          "cell",
          result.cells.has(key) ? "is-path" : "",
          isStar ? "is-waypoint" : "",
          collected.has(key) ? "is-collected" : "",
          isSource ? "is-source" : "",
          isTarget ? "is-target" : "",
          mirror ? "is-mirror" : "",
        ].filter(Boolean).join(" ");

        html += '<div class="' + classes + '">';
        if (mirror) {
          const orientation = mirrorAngles[mirror.id] || mirror.start;
          const tilt = orientation === "/" ? "up to the right" : "down to the right";
          html += '<button class="mirror-tile ' + (orientation === "/" ? "orientation-slash" : "orientation-backslash") +
            '" type="button" data-mirror="' + mirror.id + '" aria-label="Mirror at row ' + (row + 1) + ", column " + (col + 1) +
            ", tilting " + tilt + '. Activate to turn it." aria-pressed="' + (orientation === "/") + '">' +
            '<span class="mirror-shaft" aria-hidden="true"></span><span class="mirror-knob" aria-hidden="true"></span></button>';
        } else if (isSource) {
          html += '<span class="source-mark" aria-hidden="true">✳</span>';
        } else if (isTarget) {
          html += '<span class="target-mark" aria-hidden="true">✿</span>';
        } else if (isStar) {
          html += '<span class="waypoint-mark" aria-hidden="true">✦</span>';
        }
        html += "</div>";
      }
    }
    puzzleGrid.innerHTML = html;

    const points = result.points.join(" ");
    beamSvg.innerHTML = points
      ? '<polyline class="beam-halo" points="' + points + '"></polyline><polyline class="beam-line" pathLength="1" points="' + points + '"></polyline><circle class="beam-head" cx="' + points.split(" ").at(-1).split(",")[0] + '" cy="' + points.split(" ").at(-1).split(",")[1] + '" r="5"></circle>'
      : "";
    beamSvg.classList.remove("is-on");
    window.cancelAnimationFrame(beamAnimation);
    beamAnimation = window.requestAnimationFrame(() => beamSvg.classList.add("is-on"));
  }

  function updateScene() {
    const level = LEVELS[levelIndex];
    const result = traceBeam(level);
    const count = result.collectedStars.length;
    const completeText = result.won;

    renderLevelButtons();
    renderBoard(result);
    $("chapterLabel").innerHTML = "FIELD NOTE " + String(levelIndex + 1).padStart(2, "0") + ' <span>·</span> ' + level.chapter;
    $("levelTitle").textContent = level.name;
    $("nightNumber").textContent = String(levelIndex + 1).padStart(2, "0");
    $("starCount").innerHTML = count + " <small>/ " + level.stars.length + "</small>";
    $("starTrack").style.setProperty("--star-progress", Math.round((count / level.stars.length) * 100) + "%");
    $("turnCount").textContent = String(turns).padStart(2, "0");
    $("bestCount").textContent = savedProgress.best[levelIndex] ? String(savedProgress.best[levelIndex]).padStart(2, "0") : "—";
    $("signalStatus").textContent = completeText
      ? "EVERY STAR IS ALIGHT"
      : result.reachedBloom
        ? "THE BLOOM IS CLOSE · " + (level.stars.length - count) + " STAR" + (level.stars.length - count === 1 ? "" : "S") + " LEFT"
        : result.looped
          ? "THE LIGHT IS CIRCLING"
          : count > 0
            ? "FOLLOW THE WARM LIGHT"
            : result.points.length > 1
              ? "A THREAD OF LIGHT IS FOUND"
              : "THE GARDEN IS QUIET";
    boardFrame.dataset.state = completeText ? "won" : result.points.length > 1 ? "listening" : "quiet";
    $("nextButton").hidden = !completeText;
    $("nextButton").innerHTML = (levelIndex === LEVELS.length - 1 ? "Wander again" : "Next meadow") + ' <span aria-hidden="true">↗</span>';

    if (completeText) {
      $("nextButton").setAttribute("aria-label", levelIndex === LEVELS.length - 1 ? "Return to the first meadow" : "Go to the next meadow");
      $("signalStatus").setAttribute("aria-label", "Every star is alight. The moonflower is awake.");
    } else {
      $("signalStatus").removeAttribute("aria-label");
    }
  }

  function resetLevel() {
    turns = 0;
    setMirrorDefaults(LEVELS[levelIndex]);
    hintMessage.hidden = true;
    updateScene();
  }

  function selectLevel(index) {
    if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) return;
    levelIndex = index;
    turns = 0;
    setMirrorDefaults(LEVELS[levelIndex]);
    hintMessage.hidden = true;
    updateScene();
  }

  function recordWin() {
    if (!savedProgress.completed.includes(levelIndex)) savedProgress.completed.push(levelIndex);
    const previousBest = Number(savedProgress.best[levelIndex]);
    if (!previousBest || turns < previousBest) savedProgress.best[levelIndex] = turns;
    saveProgress();
    playTone(784, 0.18);
    window.setTimeout(() => playTone(988, 0.23), 110);
  }

  function rotateMirror(id) {
    const level = LEVELS[levelIndex];
    const mirror = level.mirrors.find((item) => item.id === id);
    if (!mirror) return;
    const previous = traceBeam(level);
    mirrorAngles[id] = (mirrorAngles[id] || mirror.start) === "/" ? "\\" : "/";
    turns += 1;
    const next = traceBeam(level);
    hintMessage.hidden = true;
    if (!previous.won && next.won) recordWin();
    updateScene();
    if (next.won && !previous.won) {
      playTone(523, 0.22);
    } else {
      playTone(480 + (turns % 4) * 55, 0.055);
    }
  }

  function showHint() {
    const level = LEVELS[levelIndex];
    const nextMirror = level.mirrors.find((mirror) => mirrorAngles[mirror.id] !== mirror.solved);
    hintMessage.textContent = nextMirror
      ? "A small clue: mirror " + (level.mirrors.indexOf(nextMirror) + 1) + " (row " + (nextMirror.row + 1) + ", column " + (nextMirror.col + 1) + ") should lean " + nextMirror.solved + "."
      : "The mirrors are all turned the right way. Follow the amber thread to the moonflower.";
    hintMessage.hidden = false;
  }

  function playTone(frequency, duration) {
    if (!soundOn) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    } catch (error) {
      // Audio is an optional flourish; it never gates the puzzle.
    }
  }

  levelList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-level]");
    if (button) selectLevel(Number(button.dataset.level));
  });

  puzzleGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mirror]");
    if (button) rotateMirror(button.dataset.mirror);
  });

  $("resetButton").addEventListener("click", resetLevel);
  $("hintButton").addEventListener("click", showHint);
  $("nextButton").addEventListener("click", () => selectLevel((levelIndex + 1) % LEVELS.length));
  $("helpButton").addEventListener("click", () => helpDialog.showModal());
  $("soundButton").addEventListener("click", () => {
    soundOn = !soundOn;
    $("soundButton").setAttribute("aria-pressed", String(soundOn));
    $("soundButton").setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
    $("soundButton").title = soundOn ? "Turn sound off" : "Turn sound on";
    if (soundOn) playTone(659, 0.08);
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || helpDialog.open) return;
    const target = event.target;
    if (target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))) return;
    if (event.key.toLowerCase() === "r") resetLevel();
    if (event.key.toLowerCase() === "h") showHint();
  });

  setMirrorDefaults(LEVELS[levelIndex]);
  updateScene();
})();

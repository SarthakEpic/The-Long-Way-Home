"use strict";

(() => {
  const SIZE = 7;
  const SAVE_KEY = "lunaria-garden-progress-v1";
  function routeDirection(from, to) {
    if (from.row === to.row && from.col !== to.col) return to.col > from.col ? "E" : "W";
    if (from.col === to.col && from.row !== to.row) return to.row > from.row ? "S" : "N";
    throw new Error("A route segment must be a nonzero horizontal or vertical line.");
  }

  function makeRouteLevel(options) {
    const delta = { E: [0, 1], W: [0, -1], N: [-1, 0], S: [1, 0] };
    const reflection = {
      E: { N: "/", S: "\\" }, W: { N: "\\", S: "/" },
      N: { E: "/", W: "\\" }, S: { E: "\\", W: "/" },
    };
    const waypoints = options.waypoints.map(([row, col]) => ({ row, col }));
    const route = [waypoints[0]];
    const occupied = new Set([cellKey(waypoints[0].row, waypoints[0].col)]);

    for (let segment = 1; segment < waypoints.length; segment += 1) {
      const end = waypoints[segment];
      const direction = routeDirection(route[route.length - 1], end);
      const [rowStep, colStep] = delta[direction];
      let row = route[route.length - 1].row;
      let col = route[route.length - 1].col;
      while (row !== end.row || col !== end.col) {
        row += rowStep;
        col += colStep;
        if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) throw new Error("A route point is outside the board.");
        const key = cellKey(row, col);
        if (occupied.has(key)) throw new Error("A route cannot cross itself.");
        occupied.add(key);
        route.push({ row, col });
      }
    }

    if (routeDirection(route[0], route[1]) !== "E") throw new Error("The firefly must start by traveling east.");
    const mirrors = [];
    for (let index = 1; index < route.length - 1; index += 1) {
      const incoming = routeDirection(route[index - 1], route[index]);
      const outgoing = routeDirection(route[index], route[index + 1]);
      if (incoming === outgoing) continue;
      const solved = reflection[incoming][outgoing];
      if (!solved) throw new Error("A mirror cannot reverse the beam.");
      const mirrorIndex = mirrors.length;
      const wrongAtStart = options.wrongMirrors.includes(mirrorIndex);
      mirrors.push({
        id: String.fromCharCode(97 + mirrorIndex),
        row: route[index].row,
        col: route[index].col,
        solved,
        start: wrongAtStart ? (solved === "/" ? "\\" : "/") : solved,
      });
    }

    const mirrorCells = new Set(mirrors.map((mirror) => cellKey(mirror.row, mirror.col)));
    const candidates = route.slice(1, -1).filter((cell) => !mirrorCells.has(cellKey(cell.row, cell.col)));
    if (options.starCount > candidates.length) throw new Error("A route needs more open cells for its star shards.");
    const stars = Array.from({ length: options.starCount }, (_, index) => {
      const selected = candidates[Math.floor(((index + 1) * candidates.length) / (options.starCount + 1))];
      return { row: selected.row, col: selected.col };
    });

    return {
      name: options.name,
      chapter: options.chapter,
      difficulty: options.difficulty,
      source: route[0],
      target: route[route.length - 1],
      mirrors,
      stars,
    };
  }
  const LEVELS = [
    {
      name: "Hush meadow",
      chapter: "THE MOON GARDEN",
      difficulty: "FIRST LIGHT",
      source: { row: 5, col: 0 },
      target: { row: 1, col: 6 },
      mirrors: [
        { id: "a", row: 5, col: 2, solved: "/", start: "\\" },
        { id: "b", row: 2, col: 2, solved: "/", start: "/" },
        { id: "c", row: 2, col: 5, solved: "\\", start: "\\" },
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
      difficulty: "GENTLE",
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
      difficulty: "WANDERER",
      source: { row: 3, col: 0 },
      target: { row: 0, col: 6 },
      mirrors: [
        { id: "a", row: 3, col: 1, solved: "\\", start: "/" },
        { id: "b", row: 5, col: 1, solved: "\\", start: "/" },
        { id: "c", row: 5, col: 4, solved: "/", start: "\\" },
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
    makeRouteLevel({
      name: "Lantern Switchback", chapter: "THE SILVER FERN", difficulty: "WINDING", starCount: 7,
      wrongMirrors: [0, 2, 4, 5, 6],
      waypoints: [[5, 0], [5, 1], [6, 1], [6, 4], [5, 4], [5, 6], [4, 6], [4, 0], [0, 0]],
    }),
    makeRouteLevel({
      name: "Foxfire Bridge", chapter: "THE SILVER FERN", difficulty: "TANGLED", starCount: 8,
      wrongMirrors: [0, 2, 4, 5, 6, 7],
      waypoints: [[1, 0], [1, 3], [0, 3], [0, 4], [1, 4], [1, 6], [4, 6], [4, 2], [6, 2], [6, 6]],
    }),
    makeRouteLevel({
      name: "The Broken Compass", chapter: "THE SILVER FERN", difficulty: "TRICKY", starCount: 9,
      wrongMirrors: [0, 2, 4, 5, 6, 7, 8],
      waypoints: [[6, 0], [6, 1], [5, 1], [5, 3], [6, 3], [6, 5], [4, 5], [4, 6], [0, 6], [0, 1], [4, 1]],
    }),
    makeRouteLevel({
      name: "Mothlight Switchback", chapter: "THE QUIET HILL", difficulty: "HARD", starCount: 10,
      wrongMirrors: [0, 1, 3, 4, 6, 7, 8, 9],
      waypoints: [[0, 0], [0, 2], [1, 2], [1, 0], [2, 0], [2, 1], [3, 1], [3, 0], [5, 0], [5, 6], [0, 6], [0, 3]],
    }),
    makeRouteLevel({
      name: "The Crooked Mile", chapter: "THE QUIET HILL", difficulty: "HARDER", starCount: 11,
      wrongMirrors: [0, 1, 3, 4, 6, 7, 8, 9, 10],
      waypoints: [[4, 0], [4, 2], [5, 2], [5, 3], [6, 3], [6, 6], [5, 6], [5, 4], [3, 4], [3, 1], [0, 1], [0, 6], [3, 6]],
    }),
    makeRouteLevel({
      name: "Starfall Circuit", chapter: "THE QUIET HILL", difficulty: "EXPERT", starCount: 12,
      wrongMirrors: [0, 1, 3, 4, 6, 7, 8, 9, 10, 11],
      waypoints: [[2, 0], [2, 1], [3, 1], [3, 0], [5, 0], [5, 2], [4, 2], [4, 3], [3, 3], [3, 2], [0, 2], [0, 6], [6, 6], [6, 1]],
    }),
    makeRouteLevel({
      name: "The Long Way Home", chapter: "BEYOND THE GARDEN", difficulty: "MASTER", starCount: 13,
      wrongMirrors: [0, 1, 3, 4, 6, 7, 8, 9, 10, 11, 12],
      waypoints: [[3, 0], [3, 3], [2, 3], [2, 4], [1, 4], [1, 5], [3, 5], [3, 6], [6, 6], [6, 1], [5, 1], [5, 5], [4, 5], [4, 0], [6, 0]],
    }),
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
  let turnHistory = [];
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
      const label = "Stage " + String(index + 1) + ": " + level.name + ", " + level.difficulty + (solved ? ", completed" : "");
      return '<button class="level-button' + (solved ? " is-solved" : "") + '" type="button" data-level="' + index + '" aria-label="' + label + '" aria-pressed="' + active + '" title="' + label + '">' +
        '<span class="level-node" aria-hidden="true"></span>' +
        '<span class="level-number">' + String(index + 1).padStart(2, "0") + '</span>' +
        '<span class="level-meta"><span class="level-name">' + level.name + '</span><small class="level-difficulty">' + level.difficulty + '</small></span>' +
        '<span class="level-state" aria-hidden="true">' + (solved ? "✦" : "") + '</span></button>';
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
          html += '<span class="source-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M22 21C12 9 7 11 9 17c2 6 8 8 13 8M26 21c10-12 15-10 13-4-2 6-8 8-13 8M22 27C11 36 9 42 15 41c5-1 9-6 11-12M26 27c11 9 13 15 7 14-5-1-9-6-11-12" fill="#e7c880" fill-opacity=".54" stroke="#f2d999" stroke-opacity=".8" stroke-width="1.2"/><circle cx="24" cy="24" r="5.3" fill="#f3c96e"/><circle cx="24" cy="24" r="2.4" fill="#fff7cf"/></svg></span>';
        } else if (isTarget) {
          html += '<span class="target-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><g fill="currentColor"><ellipse cx="24" cy="10" rx="4" ry="7"/><ellipse cx="24" cy="38" rx="4" ry="7"/><ellipse cx="10" cy="24" rx="7" ry="4"/><ellipse cx="38" cy="24" rx="7" ry="4"/><ellipse cx="14.1" cy="14.1" rx="4" ry="7" transform="rotate(-45 14.1 14.1)"/><ellipse cx="33.9" cy="14.1" rx="4" ry="7" transform="rotate(45 33.9 14.1)"/><ellipse cx="14.1" cy="33.9" rx="4" ry="7" transform="rotate(45 14.1 33.9)"/><ellipse cx="33.9" cy="33.9" rx="4" ry="7" transform="rotate(-45 33.9 33.9)"/></g><circle cx="24" cy="24" r="4.1" fill="#e7c37d" stroke="#283e2f" stroke-width="1"/><path d="M23 34c-5 5-10 4-11 3 2-5 6-7 11-6m3 4c5 5 10 4 11 3-2-5-6-7-11-6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></span>';
        } else if (isStar) {
          html += '<span class="waypoint-mark" aria-hidden="true">✧</span>';
        }
        html += "</div>";
      }
    }
    puzzleGrid.innerHTML = html;

    const points = result.points.join(" ");
    beamSvg.innerHTML = points
      ? '<polyline class="beam-halo" pathLength="1" points="' + points + '"></polyline><polyline class="beam-line" pathLength="1" points="' + points + '"></polyline><circle class="beam-head" cx="' + points.split(" ").at(-1).split(",")[0] + '" cy="' + points.split(" ").at(-1).split(",")[1] + '" r="5"></circle>'
      : "";
    beamSvg.classList.remove("is-on");
    window.cancelAnimationFrame(beamAnimation);
    beamAnimation = window.requestAnimationFrame(() => beamSvg.classList.add("is-on"));
  }

  function updateObjective(id, complete) {
    const objective = $(id);
    const label = objective.querySelector("span:last-child").textContent.trim();
    objective.classList.toggle("is-complete", complete);
    objective.setAttribute("aria-label", (complete ? "Complete: " : "Not complete: ") + label);
    const marker = objective.querySelector(".objective-check");
    marker.textContent = complete ? "✓" : marker.dataset.step;
  }

  function updateScene() {
    const level = LEVELS[levelIndex];
    const result = traceBeam(level);
    const count = result.collectedStars.length;
    const completeText = result.won;

    renderLevelButtons();
    renderBoard(result);
    $("chapterLabel").innerHTML = "STAGE " + String(levelIndex + 1).padStart(2, "0") + ' <span>·</span> ' + level.chapter;
    $("levelTitle").textContent = level.name;
    $("nightNumber").textContent = "01";
    $("meadowNumber").textContent = String(levelIndex + 1).padStart(2, "0");
    $("missionCount").textContent = String(levelIndex + 1).padStart(2, "0");
    $("missionTotal").textContent = String(LEVELS.length).padStart(2, "0");
    $("routeTotalTag").textContent = LEVELS.length + " ROUTES";
    $("missionCopy").textContent = "Lead the firefly through all " + level.stars.length + " star shards and into the moonflower.";
    updateObjective("objectiveMirrors", level.mirrors.every((mirror) => mirrorAngles[mirror.id] === mirror.solved));
    updateObjective("objectiveStars", count === level.stars.length);
    updateObjective("objectiveBloom", result.reachedBloom);
    $("starCount").innerHTML = count + " <small>/ " + level.stars.length + "</small>";
    $("starTrack").style.setProperty("--star-progress", Math.round((count / level.stars.length) * 100) + "%");
    $("turnCount").textContent = String(turns).padStart(2, "0");
    $("undoButton").disabled = turnHistory.length === 0;
    $("bestCount").textContent = savedProgress.best[levelIndex] ? String(savedProgress.best[levelIndex]).padStart(2, "0") : "—";
    $("signalStatus").textContent = completeText
      ? "ROUTE CLEAR // ALL SHARDS FOUND"
      : result.reachedBloom
        ? "MOONFLOWER READY // " + (level.stars.length - count) + " STAR" + (level.stars.length - count === 1 ? "" : "S") + " LEFT"
        : result.looped
          ? "BEAM LOOPED // TURN A MIRROR TO UNKNOT IT"
          : count === level.stars.length
            ? "ALL SHARDS FOUND // GUIDE THE BEAM TO THE BLOOM"
            : count > 0
              ? count + " / " + level.stars.length + " STAR SHARD" + (count === 1 ? "" : "S") + " FOUND"
              : result.points.length > 1
                ? "BEAM IN FLIGHT"
                : "BEAM STANDBY";
    boardFrame.dataset.state = completeText ? "won" : result.points.length > 1 ? "listening" : "quiet";
    $("nextButton").hidden = !completeText;
    $("nextButton").innerHTML = (levelIndex === LEVELS.length - 1 ? "Replay route" : "Next stage") + ' <span aria-hidden="true">→</span>';

    if (completeText) {
      $("nextButton").setAttribute("aria-label", levelIndex === LEVELS.length - 1 ? "Replay the first stage" : "Go to the next stage");
      $("signalStatus").setAttribute("aria-label", "Stage clear. All stars found and moonflower awake.");
    } else {
      $("signalStatus").removeAttribute("aria-label");
    }
  }

  function resetLevel() {
    turns = 0;
    turnHistory = [];
    setMirrorDefaults(LEVELS[levelIndex]);
    hintMessage.hidden = true;
    updateScene();
  }

  function selectLevel(index) {
    if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) return;
    levelIndex = index;
    turns = 0;
    turnHistory = [];
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
    const keepMirrorFocus = document.activeElement && document.activeElement.dataset.mirror === id;
    const previous = traceBeam(level);
    turnHistory.push({ mirrorAngles: { ...mirrorAngles }, turns });
    mirrorAngles[id] = (mirrorAngles[id] || mirror.start) === "/" ? "\\" : "/";
    turns += 1;
    const next = traceBeam(level);
    hintMessage.hidden = true;
    if (!previous.won && next.won) recordWin();
    updateScene();
    if (keepMirrorFocus) {
      const updatedMirror = puzzleGrid.querySelector('[data-mirror="' + id + '"]');
      if (updatedMirror) updatedMirror.focus({ preventScroll: true });
    }
    if (!next.won || previous.won) playTone(480 + (turns % 4) * 55, 0.055);
  }

  function undoLastTurn() {
    const previousTurn = turnHistory.pop();
    if (!previousTurn) return;
    const activeMirror = document.activeElement && document.activeElement.dataset.mirror;
    mirrorAngles = previousTurn.mirrorAngles;
    turns = previousTurn.turns;
    hintMessage.hidden = true;
    updateScene();
    if (activeMirror) {
      const restoredMirror = puzzleGrid.querySelector('[data-mirror="' + activeMirror + '"]');
      if (restoredMirror) restoredMirror.focus({ preventScroll: true });
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
    if (button) {
      const selectedLevel = Number(button.dataset.level);
      selectLevel(selectedLevel);
      const updatedButton = levelList.querySelector('[data-level="' + selectedLevel + '"]');
      if (updatedButton) updatedButton.focus({ preventScroll: true });
    }
  });

  puzzleGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mirror]");
    if (button) rotateMirror(button.dataset.mirror);
  });

  $("resetButton").addEventListener("click", resetLevel);
  $("undoButton").addEventListener("click", undoLastTurn);
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
    if (event.key.toLowerCase() === "z") undoLastTurn();
    else if (event.key.toLowerCase() === "r") resetLevel();
    else if (event.key.toLowerCase() === "h") showHint();
  });

  setMirrorDefaults(LEVELS[levelIndex]);
  updateScene();
})();

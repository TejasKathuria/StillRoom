// Stillroom Lofi Player Application Script with P2P Co-Study Space

// --- DATA DEFINITIONS ---

// Curated Lofi Playlist
const playlist = [
  {
    title: "Balmy",
    artist: "90sFlav",
    src: "https://jetsetradio.live/radio/stations/lofi/90sFlav - Balmy.mp3"
  },
  {
    title: "Call Me",
    artist: "90sFlav",
    src: "https://jetsetradio.live/radio/stations/lofi/90sFlav - Call Me.mp3"
  },
  {
    title: "Coffee",
    artist: "Aso",
    src: "https://jetsetradio.live/radio/stations/lofi/Aso - Coffee.mp3"
  },
  {
    title: "A Beautiful Name",
    artist: "Burbank",
    src: "https://jetsetradio.live/radio/stations/lofi/Burbank - A Beautiful Name.mp3"
  },
  {
    title: "Moonlights",
    artist: "Burbank",
    src: "https://jetsetradio.live/radio/stations/lofi/Burbank - Moonlights.mp3"
  },
  {
    title: "The Shadow Of Your Smile",
    artist: "Burbank",
    src: "https://jetsetradio.live/radio/stations/lofi/Burbank - The Shadow Of Your Smile.mp3"
  },
  {
    title: "The Place",
    artist: "DLJ (Feat J'san)",
    src: "https://jetsetradio.live/radio/stations/lofi/DLJ - The Place (Feat J'san).mp3"
  },
  {
    title: "Moon",
    artist: "Dontcry",
    src: "https://jetsetradio.live/radio/stations/lofi/Dontcry - Moon.mp3"
  },
  {
    title: "Misunderstood",
    artist: "Dontcry & Nokiaa",
    src: "https://jetsetradio.live/radio/stations/lofi/Dontcry & Nokiaa - Misunderstood.mp3"
  },
  {
    title: "Lake Serene",
    artist: "Altitude",
    src: "https://jetsetradio.live/radio/stations/lofi/Altitude - lake serene.mp3"
  }
];

// Ambient Sounds config
const ambientConfig = {
  rain: {
    src: "https://raw.githubusercontent.com/deanandreakis/Sleepster/master/rain.mp3",
    audio: null,
    defaultVol: 0
  },
  fire: {
    src: "https://raw.githubusercontent.com/deanandreakis/Sleepster/master/campfire.mp3",
    audio: null,
    defaultVol: 0
  },
  wind: {
    src: "https://raw.githubusercontent.com/deanandreakis/Sleepster/master/wind.mp3",
    audio: null,
    defaultVol: 0
  },
  ocean: {
    src: "https://raw.githubusercontent.com/deanandreakis/Sleepster/master/waves.mp3",
    audio: null,
    defaultVol: 0
  }
};

// Focus Quotes
const focusQuotes = [
  "stay focused, stay cozy",
  "breathe in, breathe out",
  "one task at a time",
  "your pace is perfect",
  "find warmth in the quiet",
  "embrace the silence",
  "disconnect to reconnect",
  "step by step, breath by breath"
];

// --- APPLICATION STATE ---
let currentTrackIndex = 0;
let isPlaying = false;
let masterVolume = 0.5;
let audioPlayer = new Audio();
let todoList = JSON.parse(localStorage.getItem("stillroom_todos")) || [];
let lastQuoteIndex = -1;

// P2P State
let nickname = localStorage.getItem("stillroom_nickname") || "CozyCat" + Math.floor(Math.random() * 900 + 100);
let peer = null;
let activeConns = {}; // peerId -> connection details

// --- DOM ELEMENTS ---
const bgContainer = document.getElementById("bg-container");
const bgVideo = document.getElementById("bg-video");
const focusTimeEl = document.getElementById("focus-time");
const focusDateEl = document.getElementById("focus-date");
const focusQuoteEl = document.getElementById("focus-quote");
const canvas = document.getElementById("rain-canvas");
const ctx = canvas.getContext("2d");

// Zen mode elements
const zenBtn = document.getElementById("zen-btn");
const zenRestoreBtn = document.getElementById("zen-toggle-floating");

// Player elements
const playBtn = document.getElementById("btn-play");
const prevBtn = document.getElementById("btn-prev");
const nextBtn = document.getElementById("btn-next");
const songTitleEl = document.getElementById("song-title");
const songArtistEl = document.getElementById("song-artist");
const currentTimeEl = document.getElementById("current-time");
const durationTimeEl = document.getElementById("duration-time");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");
const masterVolSlider = document.getElementById("master-volume");
const musicPanel = document.getElementById("music-player-panel");

// Todo elements
const todoInput = document.getElementById("todo-input");
const todoAddBtn = document.getElementById("todo-add-btn");
const todoListEl = document.getElementById("todo-list");
const todoStatsEl = document.getElementById("todo-stats");
const todoClearBtn = document.getElementById("todo-clear-btn");

// Co-Study elements
const nicknameInput = document.getElementById("nickname-input");
const peerIdText = document.getElementById("peer-id-text");
const copyIdBtn = document.getElementById("copy-id-btn");
const friendIdInput = document.getElementById("friend-id-input");
const connectBtn = document.getElementById("connect-btn");
const friendsListEl = document.getElementById("friends-list");

// --- INITIALIZATION ---
function init() {
  // Load and play the permanent lofi video loop (featuring the sleeping cat)
  bgVideo.src = "https://raw.githubusercontent.com/avinash201199/stopwatch/master/lofi2.mp4";
  bgVideo.play().catch(err => {
    console.log("Muted video autoplay blocked, waiting for user click:", err);
  });

  // Setup clock & date widget
  updateClock();
  setInterval(updateClock, 1000);

  // Setup cozy focus quote
  updateQuote();
  setInterval(updateQuote, 60000); // changes quote every minute

  // Set user nickname input
  nicknameInput.value = nickname;

  // Initialize PeerJS
  initP2P();

  // Setup audio player
  initAudioPlayer();

  // Setup ambient mixer
  initAmbientMixer();

  // Setup canvas rain animation
  initRainEffect();

  // Setup Todo List
  renderTodos();

  // Render P2P panel initial state
  renderFriendsList();

  // Bind all event listeners
  bindEvents();
}

// --- CLOCK MODULE ---
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // Format: HH:MM
  focusTimeEl.textContent = `${hours}:${minutes}`;

  // Format: Wednesday, August 19
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  focusDateEl.textContent = now.toLocaleDateString('en-US', options);
}

// --- FOCUS QUOTE ---
function updateQuote() {
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * focusQuotes.length);
  } while (nextIndex === lastQuoteIndex && focusQuotes.length > 1);

  lastQuoteIndex = nextIndex;
  
  // Fade effect
  focusQuoteEl.style.opacity = 0;
  setTimeout(() => {
    focusQuoteEl.textContent = focusQuotes[lastQuoteIndex];
    focusQuoteEl.style.opacity = document.body.classList.contains("zen-mode") ? 1 : 0.8;
  }, 400);
}

// --- CANVAS RAIN EFFECT ---
let particles = [];
let rainSpeedFactor = 0; // Linked to Rain Ambient slider

function initRainEffect() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Create initial particles
  const maxParticles = 120;
  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      l: Math.random() * 20 + 10, // length
      xs: -2 + Math.random() * 1.5, // x speed (slanted left)
      ys: Math.random() * 10 + 15, // y speed
      opacity: Math.random() * 0.3 + 0.1
    });
  }

  animateRain();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function animateRain() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Rain opacity scales up if the user increases rain ambient slider
  const densityMultiplier = 0.2 + (rainSpeedFactor * 0.8);
  
  ctx.strokeStyle = "rgba(174, 219, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  particles.forEach(p => {
    // Render drop
    ctx.strokeStyle = `rgba(174, 219, 255, ${p.opacity * densityMultiplier})`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.xs, p.y + p.l);
    ctx.stroke();

    // Update speed based on rain volume slider
    const currentSpeed = p.ys * (1 + rainSpeedFactor * 0.5);

    // Move drop
    p.x += p.xs;
    p.y += currentSpeed;

    // Reset when off screen
    if (p.y > canvas.height) {
      p.y = -p.l;
      p.x = Math.random() * canvas.width;
    }
  });

  requestAnimationFrame(animateRain);
}

// --- LOFI MUSIC PLAYER ---
function initAudioPlayer() {
  loadTrack(currentTrackIndex);
  audioPlayer.volume = masterVolume;
}

function loadTrack(index) {
  audioPlayer.pause();
  const track = playlist[index];
  audioPlayer.src = encodeURI(track.src);
  audioPlayer.load();

  songTitleEl.textContent = track.title;
  songArtistEl.textContent = track.artist;
  
  // Reset track times
  currentTimeEl.textContent = "0:00";
  durationTimeEl.textContent = "0:00";
  progressBar.style.width = "0%";
}

function togglePlay() {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function playTrack() {
  // Browsers block playing sound before user gesture. Wrapping in try/catch.
  audioPlayer.play()
    .then(() => {
      isPlaying = true;
      musicPanel.classList.add("playing");
      playBtn.innerHTML = `
        <svg id="pause-icon" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      `;
      // Also kickstart any active ambient sounds that are looping in the background
      resumeActiveAmbientSounds();
    })
    .catch(e => {
      console.warn("Playback blocked by browser autofocus rules, waiting for user click.", e);
    });
}

// Ensure elements exist to avoid crashes if player toggles
function pauseTrack() {
  audioPlayer.pause();
  isPlaying = false;
  musicPanel.classList.remove("playing");
  playBtn.innerHTML = `
    <svg id="play-icon" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
  `;
}

function prevTrack() {
  currentTrackIndex--;
  if (currentTrackIndex < 0) {
    currentTrackIndex = playlist.length - 1;
  }
  loadTrack(currentTrackIndex);
  if (isPlaying) playTrack();
}

function nextTrack() {
  currentTrackIndex++;
  if (currentTrackIndex >= playlist.length) {
    currentTrackIndex = 0;
  }
  loadTrack(currentTrackIndex);
  if (isPlaying) playTrack();
}

function updateProgressBar() {
  const currentTime = audioPlayer.currentTime;
  const duration = audioPlayer.duration;
  
  if (isNaN(duration)) return;

  const pct = (currentTime / duration) * 100;
  progressBar.style.width = `${pct}%`;

  currentTimeEl.textContent = formatTime(currentTime);
  durationTimeEl.textContent = formatTime(duration);
}

function setProgress(e) {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = audioPlayer.duration;

  if (isNaN(duration)) return;
  audioPlayer.currentTime = (clickX / width) * duration;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- AMBIENT MIXER MODULE ---
function initAmbientMixer() {
  // Initialize looping audio elements
  Object.keys(ambientConfig).forEach(key => {
    const sound = ambientConfig[key];
    sound.audio = new Audio(sound.src);
    sound.audio.loop = true;
    sound.audio.volume = 0; // Starts silent
  });
}

function handleAmbientVolume(key, val) {
  const config = ambientConfig[key];
  if (!config) return;

  // Save volume value
  config.audio.volume = val * masterVolume;

  // React to canvas rain
  if (key === "rain") {
    rainSpeedFactor = val;
  }

  // Update label
  const percentLabel = document.getElementById(`label-${key}`);
  if (percentLabel) {
    percentLabel.textContent = `${Math.round(val * 100)}%`;
  }

  // Update Mixer card state
  const card = document.getElementById(`mixer-${key}`);
  if (card) {
    if (val > 0) {
      card.classList.add("active");
      // Try playing the loop in case it isn't playing
      if (config.audio.paused) {
        config.audio.play().catch(e => console.log("Ambient autoplay blocked:", e));
      }
    } else {
      card.classList.remove("active");
      config.audio.pause();
    }
  }
}

function toggleAmbientSound(key) {
  const config = ambientConfig[key];
  if (!config) return;

  const slider = document.getElementById(`slider-${key}`);
  if (!slider) return;

  // If silent, set to 50%; if playing, mute it (set to 0)
  if (config.audio.volume === 0) {
    slider.value = 0.5;
    handleAmbientVolume(key, 0.5);
  } else {
    slider.value = 0;
    handleAmbientVolume(key, 0);
  }
}

function resumeActiveAmbientSounds() {
  // Ensures any slider set > 0 actually runs when the user starts the music
  Object.keys(ambientConfig).forEach(key => {
    const config = ambientConfig[key];
    const slider = document.getElementById(`slider-${key}`);
    if (slider && parseFloat(slider.value) > 0 && config.audio.paused) {
      config.audio.play().catch(err => console.log("Failed playing ambient sound:", err));
    }
  });
}

function updateAmbientVolumesForMaster() {
  // Call whenever master volume slider shifts to scale ambient outputs
  Object.keys(ambientConfig).forEach(key => {
    const config = ambientConfig[key];
    const slider = document.getElementById(`slider-${key}`);
    if (slider) {
      config.audio.volume = parseFloat(slider.value) * masterVolume;
    }
  });
}

// --- TO-DO LIST MODULE ---
function renderTodos() {
  todoListEl.innerHTML = "";
  
  todoList.forEach((todo, idx) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    
    li.innerHTML = `
      <div class="todo-item-left">
        <label class="todo-checkbox-wrapper">
          <input type="checkbox" class="todo-checkbox" data-index="${idx}" ${todo.completed ? "checked" : ""}>
          <span class="todo-checkmark"></span>
        </label>
        <span class="todo-text">${escapeHTML(todo.text)}</span>
      </div>
      <button class="todo-delete-btn" data-index="${idx}" title="Delete Task">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    `;
    
    todoListEl.appendChild(li);
  });

  updateTodoStats();
}

function addTodo() {
  const text = todoInput.value.trim();
  if (text === "") return;

  todoList.push({
    text: text,
    completed: false
  });

  todoInput.value = "";
  saveTodos();
  renderTodos();
  
  // Broadcast todo stats update P2P
  broadcastStatus();
}

function toggleTodo(index) {
  todoList[index].completed = !todoList[index].completed;
  saveTodos();
  renderTodos();
  
  // Broadcast todo stats update P2P
  broadcastStatus();
}

function deleteTodo(index) {
  todoList.splice(index, 1);
  saveTodos();
  renderTodos();
  
  // Broadcast todo stats update P2P
  broadcastStatus();
}

function clearCompletedTodos() {
  todoList = todoList.filter(todo => !todo.completed);
  saveTodos();
  renderTodos();
  
  // Broadcast todo stats update P2P
  broadcastStatus();
}

function updateTodoStats() {
  const total = todoList.length;
  const completed = todoList.filter(t => t.completed).length;
  todoStatsEl.textContent = `${completed}/${total} completed`;
}

function saveTodos() {
  localStorage.setItem("stillroom_todos", JSON.stringify(todoList));
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- P2P CO-STUDY SPACE MODULE ---
function initP2P() {
  // Connect to free PeerJS cloud signaling server
  peer = new Peer(null, {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  });

  peer.on('open', (id) => {
    console.log("Joined signaling server. Peer ID is:", id);
    peerIdText.textContent = id;
  });

  peer.on('error', (err) => {
    console.error("PeerJS registration error:", err);
    peerIdText.textContent = "Offline (Retry)";
  });

  // Listen for incoming co-workers connecting to us
  peer.on('connection', (conn) => {
    setupConnection(conn);
  });
}

function setupConnection(conn) {
  conn.on('open', () => {
    console.log("Connected to peer:", conn.peer);
    activeConns[conn.peer] = {
      conn: conn,
      nickname: "Co-Worker",
      totalTasks: 0,
      completedTasks: 0,
      activeTask: "Connecting..."
    };

    // Send our nickname and stats to them
    sendStatus(conn);
    renderFriendsList();
  });

  conn.on('data', (data) => {
    handleIncomingData(conn.peer, data);
  });

  conn.on('close', () => {
    console.log("Connection closed with peer:", conn.peer);
    delete activeConns[conn.peer];
    renderFriendsList();
  });

  conn.on('error', (err) => {
    console.error("Connection error with peer:", conn.peer, err);
    delete activeConns[conn.peer];
    renderFriendsList();
  });
}

function handleIncomingData(peerId, data) {
  if (!activeConns[peerId]) return;

  if (data.type === "STATUS_UPDATE") {
    activeConns[peerId].nickname = data.nickname;
    activeConns[peerId].totalTasks = data.totalTasks;
    activeConns[peerId].completedTasks = data.completedTasks;
    activeConns[peerId].activeTask = data.activeTask;
    renderFriendsList();
  } else if (data.type === "REACTION") {
    showFloatingEmoji(data.emoji);
  }
}

function broadcastStatus() {
  const firstActive = todoList.find(t => !t.completed);
  const activeTaskText = firstActive ? firstActive.text : (todoList.length > 0 ? "All done! 🎉" : "Idle");

  const msg = {
    type: "STATUS_UPDATE",
    nickname: nickname,
    totalTasks: todoList.length,
    completedTasks: todoList.filter(t => t.completed).length,
    activeTask: activeTaskText
  };

  Object.keys(activeConns).forEach(id => {
    const friend = activeConns[id];
    if (friend.conn && friend.conn.open) {
      friend.conn.send(msg);
    }
  });
}

function sendStatus(conn) {
  const firstActive = todoList.find(t => !t.completed);
  const activeTaskText = firstActive ? firstActive.text : (todoList.length > 0 ? "All done! 🎉" : "Idle");

  const msg = {
    type: "STATUS_UPDATE",
    nickname: nickname,
    totalTasks: todoList.length,
    completedTasks: todoList.filter(t => t.completed).length,
    activeTask: activeTaskText
  };

  if (conn.open) {
    conn.send(msg);
  }
}

function connectToFriend() {
  const friendId = friendIdInput.value.trim();
  if (!friendId) return;

  if (friendId === peer.id) {
    alert("That's your own ID code!");
    return;
  }

  if (activeConns[friendId]) {
    alert("You are already connected to this partner!");
    return;
  }

  console.log("Initiating WebRTC connection to friend ID:", friendId);
  const conn = peer.connect(friendId);
  setupConnection(conn);

  friendIdInput.value = "";
}

function renderFriendsList() {
  friendsListEl.innerHTML = "";
  const ids = Object.keys(activeConns);

  if (ids.length === 0) {
    friendsListEl.innerHTML = `<li class="friend-item" style="color: var(--text-muted); font-size: 11px; justify-content: center; border: none; background: transparent;">Your co-study space is empty. Invite a friend!</li>`;
    return;
  }

  ids.forEach(id => {
    const friend = activeConns[id];
    const li = document.createElement("li");
    li.className = "friend-item";

    li.innerHTML = `
      <div class="friend-info">
        <div class="friend-name-row">
          <span class="friend-dot"></span>
          <span class="friend-name">${escapeHTML(friend.nickname)}</span>
        </div>
        <span class="friend-task" title="${escapeHTML(friend.activeTask)}">
          ${friend.totalTasks > 0 ? `${friend.completedTasks}/${friend.totalTasks} done • ` : ""}Focusing on: ${escapeHTML(friend.activeTask)}
        </span>
      </div>
      <div class="friend-actions">
        <button class="reaction-btn" data-peer="${id}" data-emoji="☕" title="Send Coffee">☕</button>
        <button class="reaction-btn" data-peer="${id}" data-emoji="👏" title="Send Claps">👏</button>
        <button class="reaction-btn" data-peer="${id}" data-emoji="🔥" title="Send Fire">🔥</button>
        <button class="reaction-btn" data-peer="${id}" data-emoji="💡" title="Send Idea">💡</button>
      </div>
    `;

    friendsListEl.appendChild(li);
  });
}

function sendReaction(peerId, emoji) {
  const friend = activeConns[peerId];
  if (friend && friend.conn && friend.conn.open) {
    friend.conn.send({
      type: "REACTION",
      emoji: emoji
    });
    showFloatingEmoji(emoji);
  }
}

function showFloatingEmoji(emoji) {
  const container = document.getElementById("reactions-container");
  if (!container) return;

  const span = document.createElement("span");
  span.className = "floating-emoji";
  span.textContent = emoji;

  // Random horizontal position and drift translation properties
  const randomX = Math.random() * 80 + 10; // 10vw to 90vw
  const drift = Math.random() * 200 - 100; // -100px to 100px

  span.style.left = `${randomX}vw`;
  span.style.setProperty("--drift", `${drift}px`);

  container.appendChild(span);

  // Auto clean-up after animation is complete
  setTimeout(() => {
    span.remove();
  }, 3000);
}

function copyInviteId() {
  const inviteId = peerIdText.textContent;
  if (inviteId === "Connecting..." || inviteId === "Offline (Retry)") return;

  navigator.clipboard.writeText(inviteId)
    .then(() => {
      const originalText = copyIdBtn.innerHTML;
      copyIdBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      setTimeout(() => {
        copyIdBtn.innerHTML = originalText;
      }, 1500);
    })
    .catch(err => {
      console.error("Clipboard copy failed:", err);
    });
}

// --- EVENT BINDING ---
function bindEvents() {
  // Zen Mode togglers
  zenBtn.addEventListener("click", () => {
    document.body.classList.add("zen-mode");
    focusQuoteEl.style.opacity = 1;
  });

  zenRestoreBtn.addEventListener("click", () => {
    document.body.classList.remove("zen-mode");
    focusQuoteEl.style.opacity = 0.8;
  });

  // Music Player events
  playBtn.addEventListener("click", togglePlay);
  prevBtn.addEventListener("click", prevTrack);
  nextBtn.addEventListener("click", nextTrack);
  
  audioPlayer.addEventListener("timeupdate", updateProgressBar);
  audioPlayer.addEventListener("ended", nextTrack);
  progressContainer.addEventListener("click", setProgress);

  // Master Volume slider
  masterVolSlider.addEventListener("input", (e) => {
    masterVolume = parseFloat(e.target.value);
    audioPlayer.volume = masterVolume;
    updateAmbientVolumesForMaster();
  });

  // Ambient sounds inputs
  Object.keys(ambientConfig).forEach(key => {
    const slider = document.getElementById(`slider-${key}`);
    const card = document.getElementById(`mixer-${key}`);
    const toggleBtn = card.querySelector(".mixer-icon-btn");

    if (slider) {
      slider.addEventListener("input", (e) => {
        handleAmbientVolume(key, parseFloat(e.target.value));
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        toggleAmbientSound(key);
      });
    }
  });

  // To-Do list events
  todoAddBtn.addEventListener("click", addTodo);
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTodo();
  });

  todoListEl.addEventListener("click", (e) => {
    const target = e.target;
    
    // Checkbox click
    if (target.classList.contains("todo-checkbox")) {
      const idx = parseInt(target.getAttribute("data-index"));
      toggleTodo(idx);
    }
    
    // Delete btn click (or click on SVG inside btn)
    const deleteBtn = target.closest(".todo-delete-btn");
    if (deleteBtn) {
      const idx = parseInt(deleteBtn.getAttribute("data-index"));
      deleteTodo(idx);
    }
  });

  todoClearBtn.addEventListener("click", clearCompletedTodos);

  // P2P / Co-Study events
  connectBtn.addEventListener("click", connectToFriend);
  friendIdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") connectToFriend();
  });

  copyIdBtn.addEventListener("click", copyInviteId);

  // Nickname change listener
  nicknameInput.addEventListener("change", (e) => {
    const nameVal = e.target.value.trim();
    if (nameVal !== "") {
      nickname = nameVal;
      localStorage.setItem("stillroom_nickname", nickname);
      broadcastStatus();
    }
  });

  // Intercept reaction buttons clicks inside friends list
  friendsListEl.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("reaction-btn")) {
      const friendId = target.getAttribute("data-peer");
      const emoji = target.getAttribute("data-emoji");
      sendReaction(friendId, emoji);
    }
  });
}

// Launch app on load
window.addEventListener("DOMContentLoaded", init);

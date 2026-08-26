/* ============================================================
   Módulo de Física · ADSO — lógica compartida (localStorage + simulador)
   ============================================================ */

const TOPICS = ["mecanica", "energia", "ondas", "magnitudes"];
const STORAGE_PREFIX = "fisica_progreso_";
const SEEN_SECTIONS_PREFIX = "fisica_secciones_";
const STUDY_TIME_KEY = "fisica_tiempo_estudio_segundos";
const THEME_KEY = "fisica_theme";

/* ---------- Botón de modo claro/oscuro ---------- */

function initThemeToggle() {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = current ? current === "dark" : prefersDark;
    const next = isDark ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  });
}

function getProgress(topic) {
  const raw = localStorage.getItem(STORAGE_PREFIX + topic);
  return raw ? Number(raw) : 0;
}

function setProgress(topic, value) {
  localStorage.setItem(STORAGE_PREFIX + topic, String(value));
}

/* ---------- Reiniciar progreso (irreversible) ---------- */

function initResetProgress() {
  const btn = document.querySelector("[data-reset-progress]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const confirmed = confirm(
      "¿Seguro que quieres reiniciar tu progreso?\n\nEsta acción es irreversible: se borrará el avance de los 4 módulos y tu tiempo de estudio acumulado."
    );
    if (!confirmed) return;

    TOPICS.forEach((topic) => {
      setProgress(topic, 0);
      localStorage.removeItem(SEEN_SECTIONS_PREFIX + topic);
    });
    localStorage.removeItem(STUDY_TIME_KEY);
    location.reload();
  });
}

/* ---------- Tiempo de estudio: suma el tiempo real con una página de tema abierta ---------- */

function getStudyTime() {
  const raw = localStorage.getItem(STUDY_TIME_KEY);
  return raw ? Number(raw) : 0;
}

function addStudyTime(seconds) {
  if (seconds <= 0) return;
  localStorage.setItem(STUDY_TIME_KEY, String(getStudyTime() + Math.round(seconds)));
}

function formatStudyTime(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function initStudyTimer() {
  let start = Date.now();

  function flush() {
    addStudyTime((Date.now() - start) / 1000);
    start = Date.now();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
    else start = Date.now();
  });

  window.addEventListener("pagehide", flush);
}

/* ---------- Polea decorativa: jala la cuerda y el peso sube ---------- */

function initPulley() {
  const pulley = document.querySelector(".pulley");
  const handle = document.querySelector("[data-pulley-handle]");
  const weight = document.querySelector("[data-pulley-weight]");
  const ropeHandle = document.querySelector("[data-pulley-rope-handle]");
  const ropeWeight = document.querySelector("[data-pulley-rope-weight]");
  const trackHandle = document.querySelector("[data-pulley-track-handle]");
  if (!pulley || !handle || !weight || !trackHandle) return;

  const MIN = 8;  // % — posición junto a la polea
  const MAX = 90; // % — posición al fondo del recorrido

  function setPositions(handlePct) {
    const weightPct = MIN + MAX - handlePct;
    handle.style.top = handlePct + "%";
    weight.style.top = weightPct + "%";
    if (ropeHandle) ropeHandle.style.height = handlePct + "%";
    if (ropeWeight) ropeWeight.style.height = weightPct + "%";
  }

  setPositions(MIN); // reposo: peso abajo, cuerda arriba junto a la polea

  let dragging = false;

  function pointerToPct(clientY) {
    const rect = trackHandle.getBoundingClientRect();
    const pct = ((clientY - rect.top) / rect.height) * 100;
    return Math.min(MAX, Math.max(MIN, pct));
  }

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    pulley.classList.add("is-dragging");
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setPositions(pointerToPct(e.clientY));
  });

  function release() {
    if (!dragging) return;
    dragging = false;
    pulley.classList.remove("is-dragging");
    setPositions(MIN);
  }

  handle.addEventListener("pointerup", release);
  handle.addEventListener("pointercancel", release);
}

/* ---------- Resorte y bloque: equivalente horizontal de la polea ---------- */

function initSpring() {
  const scene = document.querySelector(".spring");
  const block = document.querySelector("[data-spring-block]");
  const coil = document.querySelector("[data-spring-coil]");
  const track = document.querySelector("[data-spring-track]");
  if (!scene || !block || !track) return;

  const MIN = 8;  // % — reposo, junto al anclaje
  const MAX = 90; // % — máximo estiramiento

  function setPosition(pct) {
    block.style.top = pct + "%";
    if (coil) coil.style.height = pct + "%";
  }

  setPosition(MIN); // reposo: bloque junto al anclaje, resorte sin estirar

  let dragging = false;

  function pointerToPct(clientY) {
    const rect = track.getBoundingClientRect();
    const pct = ((clientY - rect.top) / rect.height) * 100;
    return Math.min(MAX, Math.max(MIN, pct));
  }

  block.addEventListener("pointerdown", (e) => {
    dragging = true;
    scene.classList.add("is-dragging");
    block.setPointerCapture(e.pointerId);
  });

  block.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setPosition(pointerToPct(e.clientY));
  });

  function release() {
    if (!dragging) return;
    dragging = false;
    scene.classList.remove("is-dragging");
    setPosition(MIN);
  }

  block.addEventListener("pointerup", release);
  block.addEventListener("pointercancel", release);
}

/* ---------- Generador de ondas (pistón + onda que baja), decorativo en tema-ondas.html ---------- */

function initWaveGenerator() {
  const scene = document.querySelector(".wave-gen");
  const piston = document.querySelector("[data-wave-piston]");
  const hint = document.querySelector("[data-wave-hint]");
  if (!scene || !piston) return;

  piston.addEventListener("click", () => {
    const active = scene.classList.toggle("is-active");
    if (hint) hint.textContent = active ? "Apaga" : "Enciende";
  });
}

/* ---------- Reglómetro de escala (zoom vertical), decorativo en tema-magnitudes.html ---------- */

function initScaleZoom() {
  const ruler = document.querySelector("[data-scale-ruler]");
  const marker = document.querySelector("[data-scale-marker]");
  const label = document.querySelector("[data-scale-label]");
  const value = document.querySelector("[data-scale-value]");
  if (!ruler || !marker || !label || !value) return;

  const STEPS = [
    { label: "Átomo", value: "10⁻¹⁰ m" },
    { label: "Célula", value: "10⁻⁵ m" },
    { label: "Hormiga", value: "10⁻² m" },
    { label: "Persona", value: "10⁰ m" },
    { label: "Edificio", value: "10² m" },
    { label: "Planeta", value: "10⁷ m" },
    { label: "Galaxia", value: "10²¹ m" },
  ];

  let currentIndex = -1;

  function setStep(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    marker.style.top = (index / (STEPS.length - 1)) * 100 + "%";
    label.textContent = STEPS[index].label;
    value.textContent = STEPS[index].value;
  }

  setStep(0);

  let dragging = false;

  function pctToIndex(clientY) {
    const rect = ruler.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return Math.round(pct * (STEPS.length - 1));
  }

  marker.addEventListener("pointerdown", (e) => {
    dragging = true;
    marker.setPointerCapture(e.pointerId);
  });

  marker.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    setStep(pctToIndex(e.clientY));
  });

  function release() {
    dragging = false;
  }

  marker.addEventListener("pointerup", release);
  marker.addEventListener("pointercancel", release);
}

/* ---------- Mención de honor: nombre + desbloqueo (ver certificado.html) ---------- */

const NAME_KEY = "fisica_nombre";
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s]*$/;

function getStudentName() {
  return localStorage.getItem(NAME_KEY) || "";
}

function setStudentName(name) {
  localStorage.setItem(NAME_KEY, name);
}

function isValidName(name) {
  const trimmed = name.trim();
  return trimmed.length >= 3 && NAME_PATTERN.test(trimmed);
}

function initCertificate() {
  const nameInput = document.querySelector("[data-cert-name]");
  const status = document.querySelector("[data-cert-status]");
  const downloadBtn = document.querySelector("[data-cert-download]");
  if (!nameInput || !downloadBtn) return;

  nameInput.value = getStudentName();

  function refresh() {
    const done = TOPICS.filter((t) => getProgress(t) >= 100).length;
    const modulesReady = done >= TOPICS.length;
    const nameReady = isValidName(nameInput.value);
    const unlocked = modulesReady && nameReady;

    downloadBtn.disabled = !unlocked;

    if (status) {
      if (!modulesReady) {
        status.textContent = `Completa los ${TOPICS.length} módulos para desbloquearla (${done}/${TOPICS.length})`;
      } else if (!nameReady) {
        status.textContent = "Ingresa tu nombre completo para desbloquearla";
      } else {
        status.textContent = "¡Lista para descargar!";
      }
    }
  }

  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ\s]/g, "");
    setStudentName(nameInput.value);
    refresh();
  });

  downloadBtn.addEventListener("click", () => {
    if (downloadBtn.disabled) return;
    window.location.href = "certificado.html";
  });

  refresh();
}

/* ---------- Página certificado.html: pinta y permite imprimir la mención ---------- */

function initCertificatePage() {
  const locked = document.querySelector("[data-cert-locked]");
  const ready = document.querySelector("[data-cert-ready]");
  const printBtn = document.querySelector("[data-cert-print]");

  const done = TOPICS.filter((t) => getProgress(t) >= 100).length;
  const name = getStudentName();
  const unlocked = done >= TOPICS.length && isValidName(name);

  if (!unlocked) {
    if (locked) locked.hidden = false;
    if (ready) ready.hidden = true;
    return;
  }

  if (locked) locked.hidden = true;
  if (ready) ready.hidden = false;

  const today = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

  document.querySelector("[data-cert-output-name]").textContent = name.trim();
  document.querySelector("[data-cert-output-date]").textContent = today;
  document.querySelector("[data-cert-output-modules]").textContent = `${done}/${TOPICS.length} módulos`;
  document.querySelector("[data-cert-output-time]").textContent = formatStudyTime(getStudyTime());

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
}

/* ---------- Home: pinta las barras de progreso desde localStorage ---------- */

function renderHomeProgress() {
  let sum = 0;
  TOPICS.forEach((topic) => {
    const value = getProgress(topic);
    sum += value;
    const bar = document.querySelector(`[data-progress-bar="${topic}"]`);
    const label = document.querySelector(`[data-progress-label="${topic}"]`);
    if (bar) bar.style.width = value + "%";
    if (label) label.textContent = value + "%";
  });
  const overall = Math.round(sum / TOPICS.length);
  const overallBar = document.querySelector('[data-progress-bar="overall"]');
  const overallLabel = document.querySelector('[data-progress-label="overall"]');
  if (overallBar) overallBar.style.width = overall + "%";
  if (overallLabel) overallLabel.textContent = overall + "%";
  const done = TOPICS.filter((t) => getProgress(t) >= 100).length;

  const modulesCount = document.querySelector("[data-modules-count]");
  if (modulesCount) modulesCount.textContent = `${done}/${TOPICS.length}`;

  const studyTime = document.querySelector("[data-study-time]");
  if (studyTime) studyTime.textContent = formatStudyTime(getStudyTime());
}

/* ---------- Tema: progreso automático por secciones vistas al hacer scroll ---------- */

function getSeenSections(topic) {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_SECTIONS_PREFIX + topic) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSeenSections(topic, ids) {
  localStorage.setItem(SEEN_SECTIONS_PREFIX + topic, JSON.stringify(ids));
}

function initSectionProgress() {
  const topic = document.body.dataset.topic;
  if (!topic) return;

  const bar = document.querySelector('[data-progress-bar="self"]');
  const label = document.querySelector('[data-progress-label="self"]');

  const links = document.querySelectorAll(".toc a");
  const sections = Array.from(links)
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const total = sections.length;
  const seen = new Set(getSeenSections(topic));

  function paint() {
    const pct = Math.round((seen.size / total) * 100);
    setProgress(topic, pct);
    if (bar) bar.style.width = pct + "%";
    if (label) label.textContent = pct + "%";
  }

  paint(); // pinta con lo ya guardado, antes de cualquier scroll

  const observer = new IntersectionObserver(
    (entries) => {
      let changed = false;
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id && !seen.has(entry.target.id)) {
          seen.add(entry.target.id);
          changed = true;
        }
      });
      if (changed) {
        setSeenSections(topic, Array.from(seen));
        paint();
      }
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ---------- TOC: resalta la sección activa al hacer scroll ---------- */

function initToc() {
  const links = document.querySelectorAll(".toc a");
  const sections = Array.from(links)
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = "#" + entry.target.id;
        const link = document.querySelector(`.toc a[href="${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ---------- Simulador de tiro parabólico (Mecánica) ---------- */

function initProjectileSimulator() {
  const canvas = document.querySelector("#sim-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const v0Input = document.querySelector("#sim-v0");
  const angleInput = document.querySelector("#sim-angle");
  const v0Value = document.querySelector("#sim-v0-value");
  const angleValue = document.querySelector("#sim-angle-value");
  const statAlcance = document.querySelector("#stat-alcance");
  const statAltura = document.querySelector("#stat-altura");
  const statTiempo = document.querySelector("#stat-tiempo");

  const g = 9.8;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const v0 = Number(v0Input.value);
    const angleDeg = Number(angleInput.value);
    const angle = (angleDeg * Math.PI) / 180;

    const alcance = (v0 * v0 * Math.sin(2 * angle)) / g;
    const alturaMax = (v0 * v0 * Math.sin(angle) * Math.sin(angle)) / (2 * g);
    const tiempoVuelo = (2 * v0 * Math.sin(angle)) / g;

    v0Value.textContent = v0.toFixed(0) + " m/s";
    angleValue.textContent = angleDeg.toFixed(0) + "°";
    statAlcance.textContent = alcance.toFixed(1) + " m";
    statAltura.textContent = alturaMax.toFixed(1) + " m";
    statTiempo.textContent = tiempoVuelo.toFixed(1) + " s";

    ctx.clearRect(0, 0, w, h);

    const pad = 30;
    const groundY = h - pad;
    const scaleX = (w - pad * 2) / Math.max(alcance, 1);
    const scaleY = (h - pad * 2) / Math.max(alturaMax, 1);
    const scale = Math.min(scaleX, scaleY);

    // suelo
    ctx.strokeStyle = "#CFC9EF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, groundY);
    ctx.lineTo(w - pad, groundY);
    ctx.stroke();

    // trayectoria
    const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#2E5CE0";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (tiempoVuelo * i) / steps;
      const x = v0 * Math.cos(angle) * t;
      const y = v0 * Math.sin(angle) * t - 0.5 * g * t * t;
      const px = pad + x * scale;
      const py = groundY - y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // punto móvil (marca el punto más alto)
    const tApex = (v0 * Math.sin(angle)) / g;
    const xApex = v0 * Math.cos(angle) * tApex;
    const yApex = alturaMax;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(pad + xApex * scale, groundY - yApex * scale, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  v0Input.addEventListener("input", draw);
  angleInput.addEventListener("input", draw);
  window.addEventListener("resize", resize);
  resize();
}

/* ---------- Logo: clic hace caer una manzana ---------- */

function initLogoAppleReveal() {
  const logo = document.querySelector(".site-header__mark");
  if (!logo) return;

  const layer = document.createElement("div");
  layer.className = "apple-fall-layer";
  document.body.appendChild(layer);

  logo.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const apple = document.createElement("img");
    apple.src = "imgs/apple.png";
    apple.alt = "Manzana";
    apple.className = "apple-fall";
    apple.style.left = Math.random() * 92 + "%";
    layer.appendChild(apple);

    apple.addEventListener("animationend", () => apple.remove());
  });
}

document.addEventListener("DOMContentLoaded", initLogoAppleReveal);

/* ---------- Login simulado ---------- */

function initInstructorLogin() {
  const form = document.querySelector("#login-form");
  const panel = document.querySelector("#instructor-panel");
  const loginCard = document.querySelector("#login-card");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    loginCard.style.display = "none";
    panel.style.display = "block";
  });
}
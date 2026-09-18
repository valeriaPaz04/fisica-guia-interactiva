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
      "¿Seguro que quieres reiniciar tu progreso?\n\nEsta acción es irreversible: se borrará el avance de los 4 módulos, tu tiempo de estudio acumulado y tu nombre guardado."
    );
    if (!confirmed) return;

    TOPICS.forEach((topic) => {
      setProgress(topic, 0);
      localStorage.removeItem(SEEN_SECTIONS_PREFIX + topic);
    });
    localStorage.removeItem(STUDY_TIME_KEY);
    localStorage.removeItem(NAME_KEY);
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

/* ---------- Modal de bienvenida: pide el nombre una sola vez, no editable después ---------- */

function showNamePrompt() {
  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Ingresa tu nombre");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb, var(--ink) 45%, transparent);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";

  const card = document.createElement("div");
  card.style.cssText =
    "background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;max-width:360px;width:100%;text-align:center;font-family:var(--font-body),sans-serif;box-shadow:0 24px 48px -20px rgba(0,0,0,.35);";

  const title = document.createElement("h2");
  title.textContent = "¡Bienvenido a la guía!";
  title.style.cssText =
    "font-family:var(--font-display),sans-serif;font-weight:700;font-size:19px;margin:0 0 8px;color:var(--ink);";

  const desc = document.createElement("p");
  desc.textContent =
    "Cuéntanos tu nombre completo: quedará listo para tu insignia digital cuando termines los módulos. No podrás cambiarlo después.";
  desc.style.cssText = "font-size:13.5px;color:var(--ink-soft);margin:0 0 20px;line-height:1.5;";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Tu nombre completo";
  input.autocomplete = "name";
  input.maxLength = 60;
  input.style.cssText =
    "font-family:inherit;font-size:14px;padding:10px 14px;border-radius:8px;border:1px solid var(--border-strong);background:var(--bg);color:var(--ink);width:100%;box-sizing:border-box;margin-bottom:6px;";

  const error = document.createElement("small");
  error.style.cssText = "display:block;min-height:16px;color:var(--danger);font-size:12px;margin-bottom:14px;";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Comenzar";
  btn.style.cssText =
    "font-family:inherit;font-weight:600;font-size:14px;border:none;border-radius:8px;padding:12px 20px;cursor:pointer;background:var(--module-accent);color:#fff;width:100%;";

  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿÑñ\s]/g, "");
    error.textContent = "";
  });

  function submit() {
    if (!isValidName(input.value)) {
      error.textContent = "Ingresa tu nombre completo (mínimo 3 letras).";
      input.focus();
      return;
    }
    setStudentName(input.value.trim());
    overlay.remove();
  }

  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  card.append(title, desc, input, error, btn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  input.focus();
}

function initNameGate() {
  if (getStudentName()) return;
  showNamePrompt();
}

document.addEventListener("DOMContentLoaded", initNameGate);

function initCertificate() {
  const namePreview = document.querySelector("[data-cert-name-preview]");
  const status = document.querySelector("[data-cert-status]");
  const downloadBtn = document.querySelector("[data-cert-download]");
  if (!downloadBtn) return;

  const name = getStudentName();
  const nameReady = isValidName(name);

  if (namePreview) namePreview.textContent = nameReady ? name.trim() : "Tu insignia";

  function refresh() {
    const done = TOPICS.filter((t) => getProgress(t) >= 100).length;
    const modulesReady = done >= TOPICS.length;
    // TEMP (dev): gating deshabilitado para poder ver la insignia mientras se desarrolla.
    // Restaurar antes de publicar: const unlocked = modulesReady && nameReady;
    const unlocked = true;

    downloadBtn.disabled = !unlocked;

    if (status) {
      if (!nameReady) {
        status.textContent = "Aún no tienes un nombre guardado";
      } else if (!modulesReady) {
        status.textContent = `Completa los ${TOPICS.length} módulos para desbloquearla (${done}/${TOPICS.length})`;
      } else {
        status.textContent = "¡Lista para descargar!";
      }
    }
  }

  downloadBtn.addEventListener("click", () => {
    if (downloadBtn.disabled) return;
    openInsigniaModal();
  });

  refresh();
}

/* ---------- Insignia digital en modal (en vez de navegar a certificado.html) ---------- */

function openInsigniaModal() {
  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Insignia digital");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb, var(--ink) 45%, transparent);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";

  const panel = document.createElement("div");
  panel.style.cssText =
    "position:relative;background:var(--surface);border-radius:20px;max-width:720px;width:100%;max-height:90vh;box-shadow:0 24px 48px -20px rgba(0,0,0,.35);overflow:hidden;";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Cerrar");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText =
    "position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:1px solid var(--border-strong);background:var(--surface);color:var(--ink);font-size:20px;line-height:1;cursor:pointer;z-index:1;";

  const iframe = document.createElement("iframe");
  iframe.src = "certificado.html?modal=1";
  iframe.title = "Insignia digital";
  iframe.style.cssText = "display:block;width:100%;height:78vh;border:none;";

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKeydown);

  panel.append(closeBtn, iframe);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

/* ---------- Página certificado.html: pinta y permite imprimir la mención ---------- */

function initCertificatePage() {
  const locked = document.querySelector("[data-cert-locked]");
  const ready = document.querySelector("[data-cert-ready]");
  const printBtn = document.querySelector("[data-cert-print]");

  const done = TOPICS.filter((t) => getProgress(t) >= 100).length;
  const name = getStudentName();
  // TEMP (dev): gating deshabilitado para poder ver la insignia mientras se desarrolla.
  // Restaurar antes de publicar: const unlocked = done >= TOPICS.length && isValidName(name);
  const unlocked = true;

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

/* ---------------- Avance: desglose por módulo y sus secciones ---------------- */

const TOPIC_META = {
  mecanica: {
    name: "Mecánica",
    href: "tema-mecanica.html",
    icon: '<path d="M3 18c4-11 14-11 18 0"/><circle cx="12" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>',
    sections: [
      { id: "cinematica", label: "Cinemática básica" },
      { id: "newton", label: "Leyes de Newton" },
      { id: "simulador", label: "Simulador" },
    ],
  },
  energia: {
    name: "Energía",
    href: "tema-energia.html",
    icon: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    sections: [
      { id: "trabajo", label: "Trabajo y potencia" },
      { id: "maquinas", label: "Máquinas" },
      { id: "calor", label: "Sistemas térmicos" },
    ],
  },
  ondas: {
    name: "Ondas",
    href: "tema-ondas.html",
    icon: '<path d="M2 12c2.5-5 5-5 5 0s2.5 5 5 0 5-5 5 0 2.5 5 5 0"/>',
    sections: [
      { id: "elementos", label: "Elementos de una onda" },
      { id: "mecanicas", label: "Ondas mecánicas" },
      { id: "sonido-luz", label: "Sonido y luz" },
    ],
  },
  magnitudes: {
    name: "Magnitudes",
    href: "tema-magnitudes.html",
    icon: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v3M15 8v3"/>',
    sections: [
      { id: "sistema-internacional", label: "Sistema Internacional" },
      { id: "conversion", label: "Conversión de unidades" },
      { id: "cifras", label: "Cifras significativas" },
    ],
  },
};

const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const PENDING_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';

function renderModuleBreakdown() {
  const container = document.querySelector("[data-module-breakdown]");
  if (!container) return;

  container.innerHTML = TOPICS.map((topic) => {
    const meta = TOPIC_META[topic];
    const pct = getProgress(topic);
    const seen = new Set(getSeenSections(topic));

    const items = meta.sections
      .map((section) => {
        const done = seen.has(section.id);
        return `<li class="${done ? "is-done" : ""}">
          <span>${done ? CHECK_SVG : PENDING_SVG} ${section.label}</span>
          <span class="module-card__status">${done ? "Completado" : "Pendiente"}</span>
        </li>`;
      })
      .join("");

    return `<a class="module-card" href="${meta.href}" data-topic="${topic}" style="text-decoration:none;color:inherit;display:block">
      <div class="module-card__top">
        <div class="module-card__head">
          <span class="module-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${meta.icon}</svg></span>
          <strong class="module-card__name">${meta.name}</strong>
        </div>
        <span class="module-card__pct">${pct}%</span>
      </div>
      <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
      <ul class="module-card__list">${items}</ul>
    </a>`;
  }).join("");
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
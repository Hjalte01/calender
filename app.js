const state = {
  events: [],
  members: [],
  photos: {},
  extraPhotos: [],
  viewMode: "month",
  photoTargetMonth: "",
  pendingPhoto: "",
  imageDrawerTab: "images",
  activePanel: "main",
  imageDrawerOpen: false,
};

const STORAGE_KEY = "photo-calendar-state-v1";
const flagOptions = [
  { value: "dk", label: "/flag_dk" },
  { value: "no", label: "/flag_no" },
  { value: "se", label: "/flag_se" },
];
const renderCache = {
  calendar: "",
  controls: "",
  drawer: "",
  eventList: "",
  members: "",
  monthPhoto: "",
  print: "",
  view: "",
  year: "",
};
let saveTimer = null;
let photoVersion = 0;

const monthInput = document.querySelector("#monthInput");
const app = document.querySelector("#app");
const previousMonthButton = document.querySelector("#previousMonthButton");
const nextMonthButton = document.querySelector("#nextMonthButton");
const monthViewButton = document.querySelector("#monthViewButton");
const yearViewButton = document.querySelector("#yearViewButton");
const titleInput = document.querySelector("#titleInput");
const photoInput = document.querySelector("#photoInput");
const printStartInput = document.querySelector("#printStartInput");
const printEndInput = document.querySelector("#printEndInput");
const controlTabs = [...document.querySelectorAll(".control-tab")];
const controlPanels = [...document.querySelectorAll("[data-panel]")];
const accentInput = document.querySelector("#accentInput");
const photoHeightInput = document.querySelector("#photoHeightInput");
const showWeekNumbersInput = document.querySelector("#showWeekNumbersInput");
const hideOutsideDaysInput = document.querySelector("#hideOutsideDaysInput");
const showMemberColorsInput = document.querySelector("#showMemberColorsInput");
const showPhotoAccentInput = document.querySelector("#showPhotoAccentInput");
const memberNameInput = document.querySelector("#memberNameInput");
const memberColorInput = document.querySelector("#memberColorInput");
const addMemberButton = document.querySelector("#addMemberButton");
const memberList = document.querySelector("#memberList");
const eventMemberInput = document.querySelector("#eventMemberInput");
const eventYearInput = document.querySelector("#eventYearInput");
const eventMonthInput = document.querySelector("#eventMonthInput");
const eventDayInput = document.querySelector("#eventDayInput");
const eventNameInput = document.querySelector("#eventNameInput");
const eventFlagInput = document.querySelector("#eventFlagInput");
const addEventButton = document.querySelector("#addEventButton");
const icsUrlInput = document.querySelector("#icsUrlInput");
const importUrlButton = document.querySelector("#importUrlButton");
const importRegexInput = document.querySelector("#importRegexInput");
const icsInput = document.querySelector("#icsInput");
const importStatus = document.querySelector("#importStatus");
const eventList = document.querySelector("#eventList");
const printButton = document.querySelector("#printButton");
const clearButton = document.querySelector("#clearButton");
const imageDrawerButton = document.querySelector("#imageDrawerButton");
const imageDrawer = document.querySelector("#imageDrawer");
const bulkPhotoInput = document.querySelector("#bulkPhotoInput");
const monthImagesTabButton = document.querySelector("#monthImagesTabButton");
const extraImagesTabButton = document.querySelector("#extraImagesTabButton");
const sampleImagesButton = document.querySelector("#sampleImagesButton");
const imageList = document.querySelector("#imageList");
const photoPreview = document.querySelector("#photoPreview");
const photoPanel = document.querySelector(".photo-panel");
const titlePreview = document.querySelector("#titlePreview");
const monthPreview = document.querySelector("#monthPreview");
const calendarGrid = document.querySelector("#calendarGrid");
const sheet = document.querySelector(".sheet");
const yearOverview = document.querySelector("#yearOverview");
const printStack = document.querySelector("#printStack");

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

init();

function init() {
  const now = new Date();
  monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  printStartInput.value = `${now.getFullYear()}-01`;
  printEndInput.value = `${now.getFullYear()}-12`;
  renderFlagOptions();
  loadSavedState();

  monthInput.addEventListener("change", renderAndSave);
  previousMonthButton.addEventListener("click", () => moveMonth(-1));
  nextMonthButton.addEventListener("click", () => moveMonth(1));
  monthViewButton.addEventListener("click", () => setViewMode("month"));
  yearViewButton.addEventListener("click", () => setViewMode("year"));
  controlTabs.forEach((tab) => {
    tab.addEventListener("click", () => setActivePanel(tab.dataset.tab));
  });
  titleInput.addEventListener("input", renderAndSave);
  printStartInput.addEventListener("change", renderAndSave);
  printEndInput.addEventListener("change", renderAndSave);
  accentInput.addEventListener("input", renderAndSave);
  photoHeightInput.addEventListener("input", renderAndSave);
  showWeekNumbersInput.addEventListener("change", renderAndSave);
  hideOutsideDaysInput.addEventListener("change", renderAndSave);
  showMemberColorsInput.addEventListener("change", renderAndSave);
  showPhotoAccentInput.addEventListener("change", renderAndSave);
  importRegexInput.addEventListener("input", renderAndSave);
  photoInput.addEventListener("change", handlePhoto);
  photoPanel.addEventListener("click", () => {
    if (!assignPendingPhoto(monthInput.value)) {
      openPhotoPicker(monthInput.value);
    }
  });
  photoPanel.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!assignPendingPhoto(monthInput.value)) {
        openPhotoPicker(monthInput.value);
      }
    }
  });
  addMemberButton.addEventListener("click", addMember);
  addEventButton.addEventListener("click", addTypedEvent);
  importUrlButton.addEventListener("click", handleIcsUrlImport);
  icsInput.addEventListener("change", handleIcsImport);
  imageDrawerButton.addEventListener("click", () => toggleImageDrawer());
  bulkPhotoInput.addEventListener("change", handleBulkPhotos);
  monthImagesTabButton.addEventListener("click", () => setImageDrawerTab("images"));
  extraImagesTabButton.addEventListener("click", () => setImageDrawerTab("extra"));
  sampleImagesButton.addEventListener("click", addSampleImages);
  printButton.addEventListener("click", printCalendar);
  window.addEventListener("beforeprint", renderPrintStack);
  clearButton.addEventListener("click", () => {
    state.events = [];
    renderAndSave();
  });
  window.addEventListener("beforeunload", () => {
    if (saveTimer) {
      saveState();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.pendingPhoto) {
      cancelPhotoAssignment();
    }
  });
  document.addEventListener("click", (event) => {
    if (!state.pendingPhoto) return;
    if (event.target.closest(".image-drawer, .photo-panel, .year-photo")) return;
    cancelPhotoAssignment();
  });

  render();
}

function addMember() {
  const name = memberNameInput.value.trim();
  if (!name) {
    memberNameInput.setCustomValidity("Enter a family member name");
    memberNameInput.reportValidity();
    return;
  }

  memberNameInput.setCustomValidity("");
  state.members.push({
    id: crypto.randomUUID(),
    name,
    color: memberColorInput.value,
  });
  memberNameInput.value = "";
  renderAndSave();
}

async function handlePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const targetMonth = state.photoTargetMonth || monthInput.value;

  setPhoto(targetMonth, await readFileAsDataUrl(file));
  state.photoTargetMonth = "";
  photoInput.value = "";
  renderAndSave();
}

async function handleBulkPhotos(event) {
  const files = [...(event.target.files ?? [])];
  if (!files.length) return;

  const images = await Promise.all(files.map(readFileAsDataUrl));
  assignIncomingPhotos(images);

  bulkPhotoInput.value = "";
  renderAndSave();
}

async function addSampleImages() {
  const images = Array.from({ length: 12 }, (_, index) => {
    const seed = `${printStartInput.value || monthInput.value}-${index + 1}`;
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1800/1200`;
  });
  assignIncomingPhotos(images);
  renderAndSave();
}

function assignIncomingPhotos(images) {
  const openMonths = buildPrintMonths()
    .map(toMonthKey)
    .filter((monthKey) => !state.photos[monthKey]);

  images.forEach((image, index) => {
    if (index < openMonths.length) {
      setPhoto(openMonths[index], image);
    } else {
      addExtraPhoto(image);
    }
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.addEventListener("load", () => {
      const maxSize = 1800;
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    });

    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.readAsDataURL(file);
    });

    image.src = objectUrl;
  });
}

function openPhotoPicker(monthKey) {
  state.photoTargetMonth = monthKey;
  photoInput.click();
}

function addTypedEvent() {
  const parsed = parseEventFields();
  if (!parsed) return;
  state.events.push(parsed);
  eventNameInput.value = "";
  renderAndSave();
}

function parseEventFields() {
  const year = Number(eventYearInput.value);
  const month = Number(eventMonthInput.value);
  const day = Number(eventDayInput.value);
  const name = eventNameInput.value.trim();
  const date = buildDateKey(year, month, day);

  if (!date || !name) {
    eventNameInput.setCustomValidity("Enter a valid date and name");
    eventNameInput.reportValidity();
    return null;
  }

  eventNameInput.setCustomValidity("");
  return normalizeEvent(
    date,
    name,
    eventMemberInput.value,
    eventFlagInput.value ? [eventFlagInput.value] : [],
  );
}

function normalizeEvent(date, text, memberId = "", flags = null) {
  const parsedFlags = flags ?? [...text.matchAll(/\/flag_([a-z]+)/g)].map((match) => match[1]);
  const birthYear = parsedFlags.length ? Number(date.slice(0, 4)) : null;
  return {
    id: crypto.randomUUID(),
    date,
    text: text.replace(/\/flag_[a-z]+/g, "").replace(/\s+/g, " ").trim(),
    flags: parsedFlags,
    memberId,
    birthYear,
    recurring: parsedFlags.length > 0,
  };
}

async function handleIcsImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const imported = addImportedEvents(parseIcs(text));
  icsInput.value = "";
  importStatus.textContent = `Imported ${imported.length} events from file.`;
  renderAndSave();
}

async function handleIcsUrlImport() {
  const url = normalizeCalendarUrl(icsUrlInput.value.trim());
  if (!url) {
    importStatus.textContent = "Paste a public iPhone calendar link first.";
    return;
  }

  importStatus.textContent = "Importing calendar link...";
  try {
    const imported = addImportedEvents(parseIcs(await fetchCalendarText(url)));
    importStatus.textContent = `Imported ${imported.length} events from calendar link.`;
    renderAndSave();
  } catch (error) {
    importStatus.textContent =
      "Could not read that link. Run `node server.js` and open http://localhost:8000, or import a downloaded .ics file.";
  }
}

async function fetchCalendarText(url) {
  try {
    return await fetchText(url);
  } catch (error) {
    return fetchText(`/import-ics?url=${encodeURIComponent(url)}`);
  }
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Calendar request failed with ${response.status}`);
  }
  return response.text();
}

function parseIcs(source) {
  const unfolded = source.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  const currentYear = getSelectedMonth().getFullYear();

  return blocks
    .map((block) => {
      const dateValue = readIcsField(block, "DTSTART");
      const summary = readIcsField(block, "SUMMARY");
      if (!dateValue || !summary) return null;

      const omitsYear = /X-APPLE-OMIT-YEAR/.test(block);
      const date = parseIcsDate(dateValue, currentYear, omitsYear);
      if (!date) return null;

      const cleaned = cleanImportedSummary(unescapeIcs(summary));
      const parsed = normalizeEvent(date, `${cleaned.name} /flag_dk`);
      if (omitsYear) {
        parsed.birthYear = cleaned.year;
      } else if (cleaned.year) {
        parsed.birthYear = cleaned.year;
        parsed.date = replaceYear(parsed.date, cleaned.year);
      }
      return parsed;
    })
    .filter(Boolean);
}

function addImportedEvents(events) {
  const imported = events.filter((event) => {
    const key = eventKey(event);
    return !state.events.some((existing) => eventKey(existing) === key);
  });
  state.events.push(...imported);
  return imported;
}

function eventKey(event) {
  const [, month, day] = event.date.split("-");
  const datePart = event.recurring && !event.birthYear ? `annual-${month}-${day}` : event.date;
  return [datePart, event.text.toLowerCase(), event.flags.join(","), event.memberId].join("|");
}

function getEventsSignature() {
  return state.events
    .map((event) =>
      [
        event.id,
        event.date,
        event.text,
        event.flags.join(","),
        event.memberId,
        event.birthYear,
        event.recurring,
      ].join(":"),
    )
    .join("|");
}

function getMembersSignature() {
  return state.members
    .map((member) => [member.id, member.name, member.color].join(":"))
    .join("|");
}

function readIcsField(block, name) {
  const line = block.split(/\r?\n/).find((item) => item.startsWith(`${name}`));
  return line ? line.slice(line.indexOf(":") + 1).trim() : "";
}

function parseIcsDate(value, fallbackYear, forceFallbackYear = false) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return "";

  const placeholderYear = match[1] === "1604" || match[1] === "1904";
  const year = forceFallbackYear || placeholderYear ? fallbackYear : match[1];
  return `${year}-${match[2]}-${match[3]}`;
}

function unescapeIcs(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function cleanImportedSummary(summary) {
  const fallback = extractSummaryParts(summary);
  const pattern = importRegexInput.value.trim();
  if (!pattern) return fallback;

  try {
    const match = summary.match(new RegExp(pattern, "u"));
    const groups = match?.groups ?? {};
    return {
      name: cleanName(groups.name || fallback.name),
      year: parseBirthYear(groups.year) || fallback.year,
    };
  } catch (error) {
    importStatus.textContent = "Import regex is invalid, so the default cleanup was used.";
    return fallback;
  }
}

function extractSummaryParts(summary) {
  const yearMatch = summary.match(/\b(18|19|20)\d{2}\b/);
  const name = summary.replace(/\b(18|19|20)\d{2}\b/g, "");
  return {
    name: cleanName(name),
    year: parseBirthYear(yearMatch?.[0]),
  };
}

function cleanName(value) {
  return value
    .replace(/\/flag_[a-z]+/gi, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[\s()[\]{}-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBirthYear(value) {
  const year = Number(value);
  const currentYear = getSelectedMonth().getFullYear();
  return year >= 1800 && year <= currentYear ? year : null;
}

function replaceYear(date, year) {
  return `${year}${date.slice(4)}`;
}

function render() {
  document.documentElement.style.setProperty("--accent", accentInput.value);
  document.documentElement.style.setProperty("--photo-height", `${photoHeightInput.value}%`);
  document.documentElement.style.setProperty(
    "--photo-accent-width",
    showPhotoAccentInput.checked ? "7px" : "0px",
  );
  document.documentElement.style.setProperty(
    "--year-photo-accent-width",
    showPhotoAccentInput.checked ? "3px" : "0px",
  );

  const selectedMonth = getSelectedMonth();
  renderMonthPhoto(selectedMonth);
  renderViewMode();
  renderControls();
  if (state.viewMode === "month") {
    renderCalendar(selectedMonth);
  }
  if (state.viewMode === "year") {
    renderYearOverview(selectedMonth.getFullYear());
  }
  if (state.imageDrawerOpen) {
    renderImageDrawer();
  } else {
    renderImageDrawer();
  }
  if (state.activePanel === "events") {
    renderEventList();
  }
  if (state.activePanel === "family" || state.activePanel === "events") {
    renderMembers();
  }
}

function renderAndSave() {
  render();
  scheduleSave();
}

function printCalendar() {
  renderPrintStack();
  saveState();
  window.print();
}

function renderPrintStack() {
  const key = [
    printStartInput.value,
    printEndInput.value,
    photoVersion,
    titleInput.value,
    photoHeightInput.value,
    showWeekNumbersInput.checked,
    hideOutsideDaysInput.checked,
    showMemberColorsInput.checked,
    getEventsSignature(),
    getMembersSignature(),
  ].join("|");
  if (renderCache.print === key) return;
  renderCache.print = key;

  printStack.innerHTML = "";
  buildPrintMonths().forEach((monthDate) => {
    printStack.append(renderPrintMonth(monthDate));
  });
}

function buildPrintMonths() {
  const start = monthKeyToDate(printStartInput.value || monthInput.value);
  const end = monthKeyToDate(printEndInput.value || monthInput.value);
  if (start > end) return [getSelectedMonth()];

  const months = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    months.push(new Date(cursor));
  }
  return months;
}

function renderPrintMonth(monthDate) {
  const page = document.createElement("section");
  page.className = "print-page";

  const monthKey = toMonthKey(monthDate);
  const photo = state.photos[monthKey] || "";
  const header = document.createElement("header");
  header.className = "print-photo-panel";
  header.classList.toggle("has-photo", Boolean(photo));

  if (photo) {
    const image = document.createElement("img");
    image.src = photo;
    image.alt = "";
    header.append(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";
    placeholder.textContent = "Choose a photo";
    header.append(placeholder);
  }

  const title = document.createElement("div");
  title.className = "calendar-title";
  const titleText = document.createElement("span");
  titleText.textContent = titleInput.value;
  const monthText = document.createElement("strong");
  monthText.textContent = monthFormatter.format(monthDate);
  title.append(titleText, monthText);
  header.append(title);

  const wrap = document.createElement("div");
  wrap.className = "calendar-wrap";
  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  grid.classList.toggle("no-weeks", !showWeekNumbersInput.checked);
  renderCalendarGrid(monthDate, grid);
  wrap.append(grid);

  page.append(header, wrap);
  return page;
}

function moveMonth(offset) {
  const selectedMonth = getSelectedMonth();
  selectedMonth.setMonth(selectedMonth.getMonth() + offset);
  monthInput.value = `${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
  renderAndSave();
}

function setViewMode(viewMode) {
  state.viewMode = viewMode;
  renderAndSave();
}

function setActivePanel(panel) {
  state.activePanel = panel;
  renderAndSave();
}

function setImageDrawerTab(tab) {
  state.imageDrawerTab = tab;
  renderAndSave();
}

function toggleImageDrawer(forceOpen = !state.imageDrawerOpen) {
  state.imageDrawerOpen = forceOpen;
  renderAndSave();
}

function getSelectedMonth() {
  const [year, month] = monthInput.value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function getCurrentPhoto() {
  return state.photos[monthInput.value] || "";
}

function setPhoto(monthKey, photo) {
  if (state.photos[monthKey] === photo) return;
  state.photos[monthKey] = photo;
  photoVersion += 1;
}

function addExtraPhoto(photo) {
  state.extraPhotos.push({
    id: crypto.randomUUID(),
    photo,
  });
  photoVersion += 1;
}

function removeExtraPhoto(id) {
  const nextPhotos = state.extraPhotos.filter((item) => item.id !== id);
  if (nextPhotos.length === state.extraPhotos.length) return;
  state.extraPhotos = nextPhotos;
  photoVersion += 1;
}

function removePhoto(monthKey) {
  if (!(monthKey in state.photos)) return;
  delete state.photos[monthKey];
  photoVersion += 1;
}

function startPhotoAssignment(photo) {
  state.pendingPhoto = photo;
  renderAndSave();
}

function cancelPhotoAssignment() {
  state.pendingPhoto = "";
  renderAndSave();
}

function assignPendingPhoto(monthKey) {
  if (!state.pendingPhoto) return false;
  setPhoto(monthKey, state.pendingPhoto);
  state.pendingPhoto = "";
  renderAndSave();
  return true;
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyToDate(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function buildMonthOptions() {
  const selectedDate = getSelectedMonth();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(selectedDate.getFullYear(), index, 1);
    const option = document.createElement("option");
    option.value = toMonthKey(date);
    option.textContent = monthFormatter.format(date);
    return option;
  });
}

function renderViewMode() {
  const key = `${state.viewMode}|${monthInput.value}`;
  if (renderCache.view === key) return;
  renderCache.view = key;
  sheet.classList.toggle("year-mode", state.viewMode === "year");
  monthViewButton.setAttribute("aria-pressed", String(state.viewMode === "month"));
  yearViewButton.setAttribute("aria-pressed", String(state.viewMode === "year"));
}

function renderControls() {
  const key = state.activePanel;
  if (renderCache.controls === key) return;
  renderCache.controls = key;
  controlTabs.forEach((tab) => {
    tab.setAttribute("aria-pressed", String(tab.dataset.tab === state.activePanel));
  });
  controlPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.panel !== state.activePanel);
  });
}

function renderMonthPhoto(selectedMonth) {
  const monthLabel = monthFormatter.format(selectedMonth);
  const photo = getCurrentPhoto();
  const key = `${monthInput.value}|${titleInput.value}|${monthLabel}|${photoVersion}|${Boolean(
    state.pendingPhoto,
  )}`;
  if (renderCache.monthPhoto === key) return;
  renderCache.monthPhoto = key;

  titlePreview.textContent = titleInput.value;
  if (photoPreview.dataset.currentSrc !== photo) {
    if (photo) {
      photoPreview.src = photo;
    } else {
      photoPreview.removeAttribute("src");
    }
    photoPreview.dataset.currentSrc = photo;
  }
  photoPanel.classList.toggle("has-photo", Boolean(photo));
  photoPanel.classList.toggle("is-assign-target", Boolean(state.pendingPhoto));
  monthPreview.textContent = monthLabel;
}

function renderImageDrawer() {
  app.classList.toggle("has-image-drawer", state.imageDrawerOpen);
  imageDrawer.classList.toggle("is-hidden", !state.imageDrawerOpen);
  imageDrawerButton.setAttribute("aria-pressed", String(state.imageDrawerOpen));
  monthImagesTabButton.setAttribute("aria-pressed", String(state.imageDrawerTab === "images"));
  extraImagesTabButton.setAttribute("aria-pressed", String(state.imageDrawerTab === "extra"));
  if (!state.imageDrawerOpen) return;

  const key = `${state.imageDrawerOpen}|${state.imageDrawerTab}|${monthInput.value}|${photoVersion}`;
  if (renderCache.drawer === key) return;
  renderCache.drawer = key;

  imageList.innerHTML = "";

  const entries =
    state.imageDrawerTab === "images"
      ? Object.entries(state.photos)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([monthKey, photo]) => ({ id: monthKey, monthKey, photo, type: "month" }))
      : state.extraPhotos.map((item) => ({ ...item, type: "extra" }));

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent =
      state.imageDrawerTab === "images" ? "No month photos added yet." : "No extra photos.";
    imageList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    imageList.append(renderImageItem(entry));
  });
}

function renderImageItem(entry) {
  const { id, monthKey, photo, type } = entry;
  const item = document.createElement("article");
  item.className = "image-item";

  const thumb = document.createElement("button");
  thumb.type = "button";
  thumb.className = "image-thumb";
  thumb.addEventListener("click", () => {
    if (monthKey) {
      monthInput.value = monthKey;
      renderAndSave();
    }
  });

  const image = document.createElement("img");
  image.src = photo;
  image.alt = "";
  thumb.append(image);

  const meta = document.createElement("div");
  meta.className = "image-meta";
  meta.textContent = monthKey ? monthFormatter.format(monthKeyToDate(monthKey)) : "Extra image";

  const monthSelect = document.createElement("select");
  const unassignedOption = document.createElement("option");
  unassignedOption.value = "";
  unassignedOption.textContent = "Extra";
  monthSelect.append(unassignedOption);
  buildMonthOptions().forEach((option) => monthSelect.append(option));
  monthSelect.value = monthKey || "";
  monthSelect.addEventListener("change", () => {
    if (monthSelect.value) {
      setPhoto(monthSelect.value, photo);
    } else {
      addExtraPhoto(photo);
    }
    if (type === "month" && monthSelect.value !== monthKey) {
      removePhoto(monthKey);
    } else if (type === "extra") {
      removeExtraPhoto(id);
    }
    renderAndSave();
  });

  const actions = document.createElement("div");
  actions.className = "image-actions";

  const assignButton = document.createElement("button");
  assignButton.type = "button";
  assignButton.textContent = "Use photo";
  assignButton.addEventListener("click", () => {
    startPhotoAssignment(photo);
  });

  const swapButton = document.createElement("button");
  swapButton.type = "button";
  swapButton.textContent = "Swap";
  swapButton.addEventListener("click", () => {
    const selectedMonth = monthInput.value;
    const currentPhoto = state.photos[selectedMonth];
    setPhoto(selectedMonth, photo);
    if (type === "month" && currentPhoto) {
      setPhoto(monthKey, currentPhoto);
    } else if (type === "month") {
      removePhoto(monthKey);
    } else if (type === "extra") {
      removeExtraPhoto(id);
      if (currentPhoto) addExtraPhoto(currentPhoto);
    }
    renderAndSave();
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => {
    if (type === "month") {
      removePhoto(monthKey);
    } else {
      removeExtraPhoto(id);
    }
    renderAndSave();
  });

  actions.append(assignButton, swapButton, removeButton);
  item.append(thumb, meta, monthSelect, actions);
  return item;
}

function renderCalendar(monthDate) {
  const key = [
    monthInput.value,
    showWeekNumbersInput.checked,
    hideOutsideDaysInput.checked,
    showMemberColorsInput.checked,
    getEventsSignature(),
    getMembersSignature(),
  ].join("|");
  if (renderCache.calendar === key) return;
  renderCache.calendar = key;

  calendarGrid.innerHTML = "";
  calendarGrid.classList.toggle("no-weeks", !showWeekNumbersInput.checked);
  renderCalendarGrid(monthDate, calendarGrid);
}

function renderCalendarGrid(monthDate, targetGrid) {
  if (showWeekNumbersInput.checked) {
    targetGrid.append(createCell("weekday", ""));
  }
  weekdays.forEach((day) => targetGrid.append(createCell("weekday", day)));

  buildCalendarDays(monthDate).forEach((week) => {
    if (showWeekNumbersInput.checked) {
      targetGrid.append(createCell("week-number", getIsoWeek(week[0])));
    }

    week.forEach((date) => {
      targetGrid.append(renderDay(date, monthDate));
    });
  });
}

function renderYearOverview(year) {
  const key = `${year}|${monthInput.value}|${photoVersion}|${Boolean(state.pendingPhoto)}`;
  if (renderCache.year === key) return;
  renderCache.year = key;

  yearOverview.innerHTML = "";

  Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(year, index, 1);
    yearOverview.append(renderYearMonth(monthDate));
  });
}

function renderYearMonth(monthDate) {
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "year-month";
  button.classList.toggle("is-selected", monthKey === monthInput.value);
  button.addEventListener("click", () => {
    monthInput.value = monthKey;
    renderAndSave();
  });

  const photo = document.createElement("div");
  photo.className = "year-photo";
  photo.classList.toggle("is-assign-target", Boolean(state.pendingPhoto));
  photo.setAttribute("role", "button");
  photo.setAttribute("tabindex", "0");
  photo.setAttribute("aria-label", `Choose photo for ${monthFormatter.format(monthDate)}`);
  photo.addEventListener("click", (event) => {
    event.stopPropagation();
    monthInput.value = monthKey;
    if (!assignPendingPhoto(monthKey)) {
      openPhotoPicker(monthKey);
      render();
    }
  });
  photo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      monthInput.value = monthKey;
      if (!assignPendingPhoto(monthKey)) {
        openPhotoPicker(monthKey);
        render();
      }
    }
  });
  if (state.photos[monthKey]) {
    const image = document.createElement("img");
    image.src = state.photos[monthKey];
    image.alt = "";
    photo.append(image);
  } else {
    photo.textContent = "No photo";
  }

  const title = document.createElement("div");
  title.className = "year-month-title";
  title.textContent = monthFormatter.format(monthDate);
  photo.append(title);

  const body = document.createElement("div");
  body.className = "year-month-body";
  body.append(renderMiniCalendar(monthDate));

  button.append(photo, body);
  return button;
}

function renderMiniCalendar(monthDate) {
  const grid = document.createElement("div");
  grid.className = "mini-calendar";

  weekdays.forEach((weekday) => {
    grid.append(createCell("mini-weekday", weekday.slice(0, 1)));
  });

  buildCalendarDays(monthDate).forEach((week) => {
    week.forEach((date) => {
      const day = createCell("mini-day", date.getDate());
      if (date.getMonth() !== monthDate.getMonth()) {
        day.classList.add("outside");
      }
      grid.append(day);
    });
  });

  return grid;
}

function renderDay(date, monthDate) {
  const cell = createCell("day", "");
  const outsideMonth = date.getMonth() !== monthDate.getMonth();
  if (outsideMonth) {
    cell.classList.add("outside");
  }
  if (outsideMonth && hideOutsideDaysInput.checked) {
    cell.classList.add("is-hidden");
  }

  const heading = document.createElement("div");
  heading.className = "day-number";
  heading.textContent = date.getDate();
  cell.append(heading);

  const events = state.events.filter((item) => eventOccursOn(item, date));
  if (events.length) {
    const list = document.createElement("div");
    list.className = "events";
    events.forEach((event) => list.append(renderCalendarEvent(event, date.getFullYear())));
    cell.append(list);
  }

  return cell;
}

function renderCalendarEvent(event, displayYear) {
  const item = document.createElement("div");
  item.className = "event";
  const member = getMember(event.memberId);
  if (member && showMemberColorsInput.checked) {
    item.classList.add("has-member-color");
    item.style.setProperty("--member-color", member.color);
  }

  event.flags.forEach((flag) => {
    const flagNode = document.createElement("span");
    flagNode.className = `flag flag-${flag}`;
    flagNode.title = `${flag.toUpperCase()} flag`;
    item.append(flagNode);
  });

  const text = document.createElement("span");
  text.className = "event-text";
  text.textContent = formatEventText(event, displayYear);
  item.append(text);

  return item;
}

function eventOccursOn(event, date) {
  const [, month, day] = event.date.split("-").map(Number);
  const recurring = event.recurring ?? Boolean(event.flags.length && event.birthYear);
  if (recurring) {
    return date.getMonth() + 1 === month && date.getDate() === day;
  }

  return event.date === toDateKey(date);
}

function formatEventText(event, displayYear) {
  if (!event.flags.length || !event.birthYear || event.birthYear >= displayYear) {
    return event.text;
  }

  return `${event.text} (${displayYear - event.birthYear})`;
}

function renderEventList() {
  const key = `${getEventsSignature()}|${getMembersSignature()}`;
  if (renderCache.eventList === key) return;
  renderCache.eventList = key;

  eventList.innerHTML = "";
  [...state.events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((event) => {
      const item = document.createElement("li");
      const text = document.createElement("span");
      const member = getMember(event.memberId);
      const memberLabel = member ? ` [${member.name}]` : "";
      text.textContent = `${event.date}${memberLabel} ${event.text}`;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Remove";
      button.addEventListener("click", () => {
        state.events = state.events.filter((entry) => entry.id !== event.id);
        renderAndSave();
      });

      item.append(text, button);
      eventList.append(item);
    });
}

function renderMembers() {
  const key = getMembersSignature();
  if (renderCache.members === key) return;
  renderCache.members = key;

  const selectedMember = eventMemberInput.value;
  eventMemberInput.innerHTML = '<option value="">Shared</option>';
  state.members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.name;
    eventMemberInput.append(option);
  });
  eventMemberInput.value = state.members.some((member) => member.id === selectedMember)
    ? selectedMember
    : "";

  memberList.innerHTML = "";
  state.members.forEach((member) => {
    const item = document.createElement("li");
    const pill = document.createElement("span");
    pill.className = "member-pill";

    const swatch = document.createElement("span");
    swatch.className = "member-swatch";
    swatch.style.setProperty("--member-color", member.color);

    const name = document.createElement("span");
    name.textContent = member.name;
    pill.append(swatch, name);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Remove";
    button.addEventListener("click", () => {
      state.members = state.members.filter((entry) => entry.id !== member.id);
      state.events = state.events.map((event) =>
        event.memberId === member.id ? { ...event, memberId: "" } : event,
      );
      renderAndSave();
    });

    item.append(pill, button);
    memberList.append(item);
  });
}

function getMember(memberId) {
  return state.members.find((member) => member.id === memberId);
}

function renderFlagOptions() {
  flagOptions.forEach((flag) => {
    const option = document.createElement("option");
    option.value = flag.value;
    option.textContent = flag.label;
    eventFlagInput.append(option);
  });
}

function buildCalendarDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const endOffset = 6 - ((last.getDay() + 6) % 7);
  const start = new Date(first);
  const end = new Date(last);
  start.setDate(first.getDate() - startOffset);
  end.setDate(last.getDate() + endOffset);

  const weeks = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(cursor);
        date.setDate(cursor.getDate() + dayIndex);
        return date;
      }),
    );
  }

  return weeks;
}

function getIsoWeek(date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  return Math.ceil(((copy - yearStart) / 86400000 + 1) / 7);
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function createCell(className, text) {
  const cell = document.createElement("div");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function buildDateKey(year, month, day) {
  if (!year || !month || !day) return "";

  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? toDateKey(date) : "";
}

function normalizeCalendarUrl(url) {
  return url.startsWith("webcal://") ? `https://${url.slice("webcal://".length)}` : url;
}

function saveState() {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = null;
  const saved = {
    events: state.events,
    members: state.members,
    photos: state.photos,
    extraPhotos: state.extraPhotos,
    settings: {
      month: monthInput.value,
      printStart: printStartInput.value,
      printEnd: printEndInput.value,
      title: titleInput.value,
      accent: accentInput.value,
      photoHeight: photoHeightInput.value,
      showWeekNumbers: showWeekNumbersInput.checked,
      hideOutsideDays: hideOutsideDaysInput.checked,
      showMemberColors: showMemberColorsInput.checked,
      showPhotoAccent: showPhotoAccentInput.checked,
      importRegex: importRegexInput.value,
      viewMode: state.viewMode,
      activePanel: state.activePanel,
      imageDrawerTab: state.imageDrawerTab,
      imageDrawerOpen: state.imageDrawerOpen,
    },
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    importStatus.textContent = "Browser storage is unavailable, so changes only last until refresh.";
  }
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveState, 250);
}

function loadSavedState() {
  let raw = "";
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return;
  }
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    state.events = Array.isArray(saved.events) ? saved.events : [];
    state.members = Array.isArray(saved.members) ? saved.members : [];
    state.photos = saved.photos && typeof saved.photos === "object" ? saved.photos : {};
    state.extraPhotos = Array.isArray(saved.extraPhotos) ? saved.extraPhotos : [];

    if (saved.settings) {
      monthInput.value = saved.settings.month || monthInput.value;
      printStartInput.value = saved.settings.printStart || printStartInput.value;
      printEndInput.value = saved.settings.printEnd || printEndInput.value;
      titleInput.value =
        saved.settings.title === "Family Calendar" ? "" : saved.settings.title || titleInput.value;
      accentInput.value = saved.settings.accent || accentInput.value;
      photoHeightInput.value = saved.settings.photoHeight || photoHeightInput.value;
      showWeekNumbersInput.checked = saved.settings.showWeekNumbers ?? showWeekNumbersInput.checked;
      hideOutsideDaysInput.checked = saved.settings.hideOutsideDays ?? hideOutsideDaysInput.checked;
      showMemberColorsInput.checked =
        saved.settings.showMemberColors ?? showMemberColorsInput.checked;
      showPhotoAccentInput.checked = saved.settings.showPhotoAccent ?? showPhotoAccentInput.checked;
      importRegexInput.value = saved.settings.importRegex || importRegexInput.value;
      state.viewMode = saved.settings.viewMode || state.viewMode;
      state.activePanel = saved.settings.activePanel || state.activePanel;
      state.imageDrawerTab = saved.settings.imageDrawerTab || state.imageDrawerTab;
      state.imageDrawerOpen = saved.settings.imageDrawerOpen ?? state.imageDrawerOpen;
    }
  } catch (error) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      return;
    }
  }
}

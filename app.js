const DEFAULT_GENERAL_MEMBER = {
  id: "general",
  name: "General",
  color: "#ffffff",
};

const state = {
  events: [],
  members: [{ ...DEFAULT_GENERAL_MEMBER }],
  photos: {},
  extraPhotos: [],
  viewMode: "month",
  photoTargetMonth: "",
  pendingPhoto: "",
  pendingSwapMonth: "",
  imageDrawerTab: "images",
  activePanel: "main",
  imageDrawerOpen: false,
};

const STORAGE_KEY = "photo-calendar-state-v1";
const EXTRA_PHOTO_LIMIT = 10;
const YEAR_PREVIEW_WIDTH = 63;
const styleDefaults = {
  accent: "#bd1f2d",
  photoHeight: "50",
  calendarFontSize: "100",
  calendarTextFont: "100",
  titleFont: "100",
  monthTitleFont: "100",
  calendarLabelFont: "100",
  showWeekNumbers: true,
  hideOutsideDays: true,
  showMemberColors: true,
  showFamilyNames: true,
  showFamilyNameColumn: true,
  showFamilyBorders: false,
  showPhotoAccent: true,
};
const paperSizes = {
  a3: { label: "A3", pageRule: "A3 portrait", width: 297, height: 420 },
  a4: { label: "A4", pageRule: "A4 portrait", width: 210, height: 297 },
  a5: { label: "A5", pageRule: "A5 portrait", width: 148, height: 210 },
};
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
const previewPane = document.querySelector("#previewPane");
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
const calendarFontSizeInput = document.querySelector("#calendarFontSizeInput");
const advancedFontButton = document.querySelector("#advancedFontButton");
const advancedFontControls = document.querySelector("#advancedFontControls");
const calendarTextFontInput = document.querySelector("#calendarTextFontInput");
const titleFontInput = document.querySelector("#titleFontInput");
const monthTitleFontInput = document.querySelector("#monthTitleFontInput");
const calendarLabelFontInput = document.querySelector("#calendarLabelFontInput");
const paperSizeInput = document.querySelector("#paperSizeInput");
const showWeekNumbersInput = document.querySelector("#showWeekNumbersInput");
const hideOutsideDaysInput = document.querySelector("#hideOutsideDaysInput");
const showMemberColorsInput = document.querySelector("#showMemberColorsInput");
const showFamilyNamesInput = document.querySelector("#showFamilyNamesInput");
const showFamilyNameColumnInput = document.querySelector("#showFamilyNameColumnInput");
const showFamilyBordersInput = document.querySelector("#showFamilyBordersInput");
const showPhotoAccentInput = document.querySelector("#showPhotoAccentInput");
const resetStyleButton = document.querySelector("#resetStyleButton");
const memberNameInput = document.querySelector("#memberNameInput");
const memberColorInput = document.querySelector("#memberColorInput");
const addMemberButton = document.querySelector("#addMemberButton");
const memberList = document.querySelector("#memberList");
const resetStorageButton = document.querySelector("#resetStorageButton");
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
const downloadPdfButton = document.querySelector("#downloadPdfButton");
const printButton = document.querySelector("#printButton");
const clearButton = document.querySelector("#clearButton");
const imageDrawerButton = document.querySelector("#imageDrawerButton");
const imageDrawer = document.querySelector("#imageDrawer");
const bulkPhotoInput = document.querySelector("#bulkPhotoInput");
const monthImagesTabButton = document.querySelector("#monthImagesTabButton");
const extraImagesTabButton = document.querySelector("#extraImagesTabButton");
const sampleImagesButton = document.querySelector("#sampleImagesButton");
const sampleImageButton = document.querySelector("#sampleImageButton");
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
  calendarFontSizeInput.addEventListener("input", renderAndSave);
  advancedFontButton.addEventListener("click", toggleAdvancedFonts);
  calendarTextFontInput.addEventListener("input", renderAndSave);
  titleFontInput.addEventListener("input", renderAndSave);
  monthTitleFontInput.addEventListener("input", renderAndSave);
  calendarLabelFontInput.addEventListener("input", renderAndSave);
  paperSizeInput.addEventListener("change", renderAndSave);
  showWeekNumbersInput.addEventListener("change", renderAndSave);
  hideOutsideDaysInput.addEventListener("change", renderAndSave);
  showMemberColorsInput.addEventListener("change", renderAndSave);
  showFamilyNamesInput.addEventListener("change", renderAndSave);
  showFamilyNameColumnInput.addEventListener("change", renderAndSave);
  showFamilyBordersInput.addEventListener("change", renderAndSave);
  showPhotoAccentInput.addEventListener("change", renderAndSave);
  resetStyleButton.addEventListener("click", resetStyleSettings);
  importRegexInput.addEventListener("input", renderAndSave);
  photoInput.addEventListener("change", handlePhoto);
  photoPanel.addEventListener("click", () => {
    handlePhotoTargetClick(monthInput.value, { openPicker: true });
  });
  photoPanel.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePhotoTargetClick(monthInput.value, { openPicker: true });
    }
  });
  addMemberButton.addEventListener("click", addMember);
  resetStorageButton.addEventListener("click", resetSavedBrowserData);
  addEventButton.addEventListener("click", addTypedEvent);
  importUrlButton.addEventListener("click", handleIcsUrlImport);
  icsInput.addEventListener("change", handleIcsImport);
  downloadPdfButton.addEventListener("click", downloadPdf);
  imageDrawerButton.addEventListener("click", () => toggleImageDrawer());
  bulkPhotoInput.addEventListener("change", handleBulkPhotos);
  monthImagesTabButton.addEventListener("click", () => setImageDrawerTab("images"));
  extraImagesTabButton.addEventListener("click", () => setImageDrawerTab("extra"));
  sampleImagesButton.addEventListener("click", () => addSampleImages(12));
  sampleImageButton.addEventListener("click", () => addSampleImages(1));
  printButton.addEventListener("click", printCalendar);
  window.addEventListener("beforeprint", renderPrintStack);
  window.addEventListener("resize", updatePreviewScale);
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
    if (event.key === "Escape" && hasPendingPhotoAction()) {
      cancelPhotoAction();
    }
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

async function resetSavedBrowserData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
    if ("caches" in window) {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    }
  } catch (error) {
    importStatus.textContent = "Could not clear saved browser data.";
    return;
  }

  window.location.reload();
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

async function addSampleImages(count) {
  const images = Array.from({ length: count }, () => {
    const seed = crypto.randomUUID();
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1800/1200`;
  });
  if (count === 12) {
    replacePrintMonthsWithPhotos(images);
  } else if (count === 1) {
    setPhoto(monthInput.value, images[0]);
  } else {
    assignIncomingPhotos(images);
  }
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

function replacePrintMonthsWithPhotos(images) {
  const months = buildPrintMonths().map(toMonthKey);
  images.forEach((image, index) => {
    const monthKey = months[index];
    if (monthKey) {
      setPhoto(monthKey, image);
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
  const paperSize = paperSizes[paperSizeInput.value] ?? paperSizes.a4;
  document.documentElement.style.setProperty("--accent", accentInput.value);
  document.documentElement.style.setProperty("--photo-height", `${photoHeightInput.value}%`);
  setCalendarFontProperties();
  document.documentElement.style.setProperty("--paper-width", `${paperSize.width}mm`);
  document.documentElement.style.setProperty("--paper-height", `${paperSize.height}mm`);
  document.documentElement.style.setProperty("--paper-aspect", `${paperSize.width} / ${paperSize.height}`);
  document.documentElement.style.setProperty(
    "--year-preview-scale",
    String(YEAR_PREVIEW_WIDTH / paperSize.width),
  );
  updatePreviewScale();
  updatePrintPageSize(paperSize);
  document.documentElement.style.setProperty(
    "--photo-accent-width",
    showPhotoAccentInput.checked ? "7px" : "0px",
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

function setCalendarFontProperties() {
  document.documentElement.style.setProperty(
    "--title-font-size",
    `${3 * getFontScale("title")}rem`,
  );
  document.documentElement.style.setProperty(
    "--month-title-font-size",
    `${1.8 * getFontScale("monthTitle")}rem`,
  );
  document.documentElement.style.setProperty(
    "--calendar-label-font-size",
    `${0.74 * getFontScale("calendarLabel")}rem`,
  );
  document.documentElement.style.setProperty(
    "--calendar-day-font-size",
    `${0.85 * getFontScale("calendarText")}rem`,
  );
  document.documentElement.style.setProperty(
    "--event-font-size",
    `${0.76 * getFontScale("calendarText")}rem`,
  );
}

function updatePreviewScale() {
  const paperSize = paperSizes[paperSizeInput.value] ?? paperSizes.a4;
  const paperWidth = (paperSize.width * 96) / 25.4;
  const paperHeight = (paperSize.height * 96) / 25.4;
  const availableWidth = previewPane.clientWidth;
  const availableHeight = previewPane.clientHeight;
  const scale = Math.min(1, availableWidth / paperWidth, availableHeight / paperHeight);
  document.documentElement.style.setProperty("--preview-scale", String(Math.max(0.1, scale)));
}

function updatePrintPageSize(paperSize) {
  let style = document.querySelector("#printPageSizeStyle");
  if (!style) {
    style = document.createElement("style");
    style.id = "printPageSizeStyle";
    document.head.append(style);
  }
  style.textContent = `@page { size: ${paperSize.pageRule}; margin: 0; }`;
}

function renderAndSave() {
  render();
  scheduleSave();
}

function resetStyleSettings() {
  accentInput.value = styleDefaults.accent;
  photoHeightInput.value = styleDefaults.photoHeight;
  calendarFontSizeInput.value = styleDefaults.calendarFontSize;
  calendarTextFontInput.value = styleDefaults.calendarTextFont;
  titleFontInput.value = styleDefaults.titleFont;
  monthTitleFontInput.value = styleDefaults.monthTitleFont;
  calendarLabelFontInput.value = styleDefaults.calendarLabelFont;
  showWeekNumbersInput.checked = styleDefaults.showWeekNumbers;
  hideOutsideDaysInput.checked = styleDefaults.hideOutsideDays;
  showMemberColorsInput.checked = styleDefaults.showMemberColors;
  showFamilyNamesInput.checked = styleDefaults.showFamilyNames;
  showFamilyNameColumnInput.checked = styleDefaults.showFamilyNameColumn;
  showFamilyBordersInput.checked = styleDefaults.showFamilyBorders;
  showPhotoAccentInput.checked = styleDefaults.showPhotoAccent;
  renderAndSave();
}

function toggleAdvancedFonts() {
  const expanded = advancedFontButton.getAttribute("aria-expanded") === "true";
  advancedFontButton.setAttribute("aria-expanded", String(!expanded));
  advancedFontControls.classList.toggle("is-hidden", expanded);
}

function printCalendar() {
  renderPrintStack();
  saveState();
  window.print();
}

async function downloadPdf() {
  const paperSize = paperSizes[paperSizeInput.value] ?? paperSizes.a4;
  const months = buildPrintMonths();
  downloadPdfButton.disabled = true;
  downloadPdfButton.textContent = "Building PDF...";

  try {
    const pdf = new PdfDocument(mmToPt(paperSize.width), mmToPt(paperSize.height));
    for (const monthDate of months) {
      await addCapturedCalendarPdfPage(pdf, monthDate, paperSize);
    }
    const blob = pdf.toBlob();
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = buildPdfFileName(months, paperSize);
    link.click();
    URL.revokeObjectURL(url);
    saveState();
  } catch (error) {
    importStatus.textContent = "Could not build PDF. Use Print as a fallback.";
  } finally {
    downloadPdfButton.disabled = false;
    downloadPdfButton.textContent = "Download PDF";
  }
}

async function addCapturedCalendarPdfPage(pdf, monthDate, paperSize) {
  const image = await capturePrintPageImage(monthDate, paperSize);
  const page = pdf.addPage();
  page.imageCover(image, 0, 0, pdf.pageWidth, pdf.pageHeight);
}

async function capturePrintPageImage(monthDate, paperSize) {
  const page = renderPrintMonth(monthDate);
  page.classList.add("pdf-export-page");

  const layer = document.createElement("div");
  layer.className = "pdf-export-layer";
  layer.style.cssText = document.documentElement.style.cssText;
  layer.append(page);
  document.body.append(layer);

  try {
    await inlinePageImages(page);
    await document.fonts?.ready;
    const width = Math.round((paperSize.width * 96) / 25.4);
    const height = Math.round((paperSize.height * 96) / 25.4);
    const scale = 2;
    const svg = buildForeignObjectSvg(layer, width, height);
    const image = await loadSvgImage(svg);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    return loadPdfImage(canvas.toDataURL("image/jpeg", 0.92));
  } finally {
    layer.remove();
  }
}

async function inlinePageImages(page) {
  const images = [...page.querySelectorAll("img")];
  await Promise.all(
    images.map(async (image) => {
      if (image.src.startsWith("data:")) return;
      try {
        image.src = await fetchImageAsDataUrl(image.src);
      } catch (error) {
        image.removeAttribute("src");
      }
    }),
  );
  await Promise.all(
    images.map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
    ),
  );
}

function buildForeignObjectSvg(layer, width, height) {
  const css = getDocumentCss();
  const captureLayer = layer.cloneNode(true);
  captureLayer.style.position = "static";
  captureLayer.style.left = "0";
  captureLayer.style.top = "0";
  const html = new XMLSerializer().serializeToString(captureLayer);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <style>${css}</style>
          ${html}
        </div>
      </foreignObject>
    </svg>`,
  )}`;
}

function getDocumentCss() {
  return [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch (error) {
        return "";
      }
    })
    .join("\n");
}

function loadSvgImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", reject, { once: true });
    image.src = source;
  });
}

async function addCalendarPdfPage(pdf, monthDate, paperSize) {
  const page = pdf.addPage();
  const pageWidth = mmToPt(paperSize.width);
  const pageHeight = mmToPt(paperSize.height);
  const photoRatio = Number(photoHeightInput.value) / 100;
  const photoHeight = pageHeight * photoRatio;
  const accentHeight = showPhotoAccentInput.checked ? 5.25 : 0;
  const padding = 13.5;
  const monthKey = toMonthKey(monthDate);
  const photo = state.photos[monthKey] || "";

  page.fill("#fffdf8");
  page.rect(0, 0, pageWidth, pageHeight, "f");
  if (photoHeight > 0) {
    page.fill("#d9d1c4");
    page.rect(0, 0, pageWidth, photoHeight, "f");

    const image = await loadPdfImage(photo);
    if (image) {
      page.imageCover(image, 0, 0, pageWidth, photoHeight);
    } else {
      page.fill("#5c6570");
      page.text("Choose a photo", pageWidth / 2 - 48, photoHeight / 2, 16, "Helvetica-Bold");
    }

    if (accentHeight) {
      page.fill(accentInput.value);
      page.rect(0, Math.max(0, photoHeight - accentHeight), pageWidth, Math.min(accentHeight, photoHeight), "f");
    }

    page.fill("#ffffff");
    page.text(
      titleInput.value || "",
      18,
      Math.max(18, photoHeight - 20),
      26 * getFontScale("title"),
      "Helvetica-Bold",
    );
    page.text(
      monthFormatter.format(monthDate).toUpperCase(),
      pageWidth - 126,
      Math.max(18, photoHeight - 20),
      14 * getFontScale("monthTitle"),
      "Helvetica-Bold",
    );
  }

  if (photoRatio < 1) {
    drawPdfCalendarGrid(page, monthDate, {
      x: padding,
      y: photoHeight + padding,
      width: pageWidth - padding * 2,
      height: pageHeight - photoHeight - padding * 2,
    });
  }
}

function drawPdfCalendarGrid(page, monthDate, box) {
  const weeks = buildCalendarDays(monthDate);
  const hasWeeks = showWeekNumbersInput.checked;
  const hasFamilySections = usesFamilyDaySections();
  const hasFamilyNameColumn = usesFamilyNameColumn();
  const headerHeightRatio = 0.22;
  const leadingColumns = [
    ...(hasWeeks ? [0.225] : []),
    ...(hasFamilyNameColumn ? [0.275] : []),
  ];
  const columns = [...leadingColumns, 1, 1, 1, 1, 1, 1, 1];
  const totalColumns = columns.reduce((sum, value) => sum + value, 0);
  const headerHeight = (box.height * headerHeightRatio) / (weeks.length + headerHeightRatio);
  const rowHeight = (box.height - headerHeight) / weeks.length;
  const columnWidths = columns.map((value) => (box.width * value) / totalColumns);
  const columnX = columnWidths.reduce(
    (positions, width) => [...positions, positions[positions.length - 1] + width],
    [box.x],
  );

  page.stroke("#000000");
  page.lineWidth(0.75);
  if (leadingColumns.length) {
    const leadingWidth = columnWidths
      .slice(0, leadingColumns.length)
      .reduce((sum, width) => sum + width, 0);
    drawPdfHeaderCell(page, "", columnX[0], box.y, leadingWidth, headerHeight);
  }
  weekdays.forEach((weekday, index) => {
    const column = leadingColumns.length + index;
    drawPdfHeaderCell(page, weekday, columnX[column], box.y, columnWidths[column], headerHeight);
  });

  weeks.forEach((week, weekIndex) => {
    const y = box.y + headerHeight + rowHeight * weekIndex;
    if (hasWeeks) {
      drawPdfWeekCell(page, week[0], columnX[0], y, columnWidths[0], rowHeight);
    }
    if (hasFamilyNameColumn) {
      const column = hasWeeks ? 1 : 0;
      drawPdfFamilyLabelCell(page, columnX[column], y, columnWidths[column], rowHeight);
    }

    week.forEach((date, dayIndex) => {
      const outsideMonth = date.getMonth() !== monthDate.getMonth();
      const hidden = outsideMonth && hideOutsideDaysInput.checked;
      const column = leadingColumns.length + dayIndex;
      const x = columnX[column];
      const width = columnWidths[column];
      page.fill(outsideMonth ? "#f7f2e9" : "#fffdf8");
      page.rect(x, y, width, rowHeight, "f");
      if (!hidden && usesFamilyDaySections()) {
        drawPdfFamilyDaySections(page, date, x, y, width, rowHeight, outsideMonth);
      }
      page.lineWidth(0.75);
      page.stroke("#000000");
      page.rect(x, y, width, rowHeight, "s");
      if (!hidden) {
        drawPdfDay(page, date, x, y, width, rowHeight, outsideMonth);
      }
    });
  });
}

function drawPdfHeaderCell(page, text, x, y, width, height) {
  const fontScale = getFontScale("calendarLabel");
  page.fill("#f4efe5");
  page.rect(x, y, width, height, "f");
  page.stroke("#000000");
  page.rect(x, y, width, height, "s");
  page.fill("#69707a");
  page.text(
    String(text).toUpperCase(),
    x + width / 2 - String(text).length * 2.4 * fontScale,
    y + height / 2 + 2,
    8 * fontScale,
    "Helvetica-Bold",
  );
}

function drawPdfWeekCell(page, date, x, y, width, height) {
  page.fill("#ffffff");
  page.rect(x, y, width, height, "f");
  page.lineWidth(0.75);
  page.stroke("#000000");
  page.rect(x, y, width, height, "s");
  page.fill("#69707a");
  page.text(String(getIsoWeek(date)), x + 4, y + 12, 7.2 * getFontScale("calendarLabel"), "Helvetica-Bold");
}

function drawPdfDay(page, date, x, y, width, height, outsideMonth) {
  const fontScale = getFontScale("calendarText");
  page.fill(outsideMonth ? "#9ea4aa" : "#1f2328");
  page.text(String(date.getDate()), x + 5, y + 13, 8.5 * fontScale, "Helvetica-Bold");

  const events = state.events.filter((item) => eventOccursOn(item, date));
  let eventY = y + 23;
  const eventStep = 10 * fontScale;
  const visibleEvents = usesFamilyDaySections()
    ? events.filter((event) => !getMember(event.memberId) && !getGeneralMember())
    : events;
  visibleEvents.slice(0, Math.max(1, Math.floor((height - 24) / eventStep))).forEach((event) => {
    const member = getMember(event.memberId);
    let textX = x + 5;
    if (member && showMemberColorsInput.checked) {
      page.fill(member.color);
      page.rect(x + 2, eventY - 7, 2, 8, "f");
    }
    event.flags.forEach((flag) => {
      drawPdfFlag(page, flag, textX, eventY - 7, 10 * fontScale, 6.5 * fontScale);
      textX += 12 * fontScale;
    });
    page.fill("#1f2328");
    page.text(formatEventText(event, date.getFullYear()), textX, eventY, 6.4 * fontScale, "Helvetica");
    eventY += eventStep;
  });
}

function drawPdfFamilyDaySections(page, date, x, y, width, height, outsideMonth) {
  const fontScale = getFontScale("calendarText");
  const sections = getFamilySections();
  const sectionHeight = height / sections.length;
  const sectionBorder = getFamilySectionBorderColor();
  const events = state.events.filter((item) => eventOccursOn(item, date));

  sections.forEach((section, index) => {
    const sectionY = y + sectionHeight * index;
    const fill = mixHexColors(section.color, outsideMonth ? "#f7f2e9" : "#ffffff", outsideMonth ? 0.34 : 0.48);
    page.fill(fill);
    page.rect(x, sectionY, width, sectionHeight, "f");
    if (sectionBorder && index < sections.length - 1) {
      page.fill(sectionBorder);
      page.rect(x, sectionY + sectionHeight - 0.25, width, 0.5, "f");
    }

    let eventY = sectionY + (index === 0 ? 23 : 10);
    const eventStep = 9 * fontScale;
    const capacity = Math.max(1, Math.floor((sectionY + sectionHeight - eventY - 3) / eventStep) + 1);
    events
      .filter((event) => eventBelongsToFamilySection(event, section))
      .slice(0, capacity)
      .forEach((event) => {
        let textX = x + 5;
        event.flags.forEach((flag) => {
          drawPdfFlag(page, flag, textX, eventY - 7, 10 * fontScale, 6.5 * fontScale);
          textX += 12 * fontScale;
        });
        page.fill("#1f2328");
        page.text(formatEventText(event, date.getFullYear()), textX, eventY, 6.4 * fontScale, "Helvetica");
        eventY += eventStep;
      });
  });
}

function drawPdfFamilyLabelCell(page, x, y, width, height) {
  const sections = getFamilySections();
  const sectionHeight = height / sections.length;
  const sectionBorder = getFamilySectionBorderColor();

  sections.forEach((section, index) => {
    const sectionY = y + sectionHeight * index;
    const fill = mixHexColors(section.color, "#ffffff", 0.48);
    page.fill(fill);
    page.rect(x, sectionY, width, sectionHeight, "f");
    if (sectionBorder && index < sections.length - 1) {
      page.fill(sectionBorder);
      page.rect(x, sectionY + sectionHeight - 0.25, width, 0.5, "f");
    }
    page.fill("#1f2328");
    if (showFamilyNamesInput.checked) {
      page.textRotated(
        section.label.slice(0, 10),
        x + width / 2 + 2,
        sectionY + sectionHeight / 2 + 8,
        4.8,
        "Helvetica-Bold",
      );
    }
  });

  page.lineWidth(0.75);
  page.stroke("#000000");
  page.rect(x, y, width, height, "s");
}

function getFamilySectionBorderColor() {
  return showFamilyBordersInput.checked ? "#000000" : "";
}

function getFontScale(section, includeOverall = true) {
  const overallValue = Number(calendarFontSizeInput.value) / 100 || 1;
  if (section === "overall") return overallValue;
  const overall = includeOverall ? overallValue : 1;
  const baseInput =
    {
      calendarText: calendarTextFontInput,
      title: titleFontInput,
      monthTitle: monthTitleFontInput,
      calendarLabel: calendarLabelFontInput,
    }[section] || calendarFontSizeInput;
  return overall * (Number(baseInput.value) / 100 || 1);
}

function drawPdfFlag(page, flag, x, y, width, height) {
  const isSweden = flag === "se";
  page.fill(isSweden ? "#006aa7" : flag === "no" ? "#ba0c2f" : "#c8102e");
  page.rect(x, y, width, height, "f");

  if (flag === "no") {
    drawPdfCross(page, x, y, width, height, "#ffffff", width * 0.24, height * 0.24);
    drawPdfCross(page, x, y, width, height, "#00205b", width * 0.12, height * 0.12);
  } else {
    drawPdfCross(page, x, y, width, height, isSweden ? "#fecc00" : "#ffffff", width * 0.16, height * 0.16);
  }
}

function drawPdfCross(page, x, y, width, height, color, verticalWidth, horizontalHeight) {
  page.fill(color);
  page.rect(x + width * 0.34, y, verticalWidth, height, "f");
  page.rect(x, y + height * 0.42, width, horizontalHeight, "f");
}

async function loadPdfImage(source) {
  if (!source) return null;
  try {
    const dataUrl = source.startsWith("data:") ? source : await fetchImageAsDataUrl(source);
    if (!dataUrl.startsWith("data:image/jpeg")) return null;
    const bytes = base64ToBinary(dataUrl.split(",")[1]);
    const size = getJpegSize(bytes);
    return size ? { bytes, ...size } : null;
  } catch (error) {
    return null;
  }
}

async function fetchImageAsDataUrl(source) {
  const response = await fetch(source);
  if (!response.ok) throw new Error("Image request failed");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(blob);
  });
}

function buildPdfFileName(months, paperSize) {
  const start = toMonthKey(months[0]);
  const end = toMonthKey(months[months.length - 1]);
  return `calendar-${paperSize.label.toLowerCase()}-${start}${start === end ? "" : `-${end}`}.pdf`;
}

function renderPrintStack() {
  const key = [
    printStartInput.value,
    printEndInput.value,
    paperSizeInput.value,
    photoVersion,
    titleInput.value,
    photoHeightInput.value,
    calendarFontSizeInput.value,
    calendarTextFontInput.value,
    titleFontInput.value,
    monthTitleFontInput.value,
    calendarLabelFontInput.value,
    showWeekNumbersInput.checked,
    hideOutsideDaysInput.checked,
    showMemberColorsInput.checked,
    showFamilyNamesInput.checked,
    showFamilyNameColumnInput.checked,
    showFamilyBordersInput.checked,
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
  grid.classList.toggle("has-family-sections", usesFamilyDaySections());
  grid.classList.toggle("has-family-name-column", usesFamilyNameColumn());
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
  state.extraPhotos = state.extraPhotos.slice(-EXTRA_PHOTO_LIMIT);
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
  state.pendingSwapMonth = "";
  renderAndSave();
}

function startPhotoSwap(monthKey) {
  if (!state.photos[monthKey]) return;
  state.pendingPhoto = "";
  state.pendingSwapMonth = monthKey;
  renderAndSave();
}

function cancelPhotoAction() {
  state.pendingPhoto = "";
  state.pendingSwapMonth = "";
  renderAndSave();
}

function hasPendingPhotoAction() {
  return Boolean(state.pendingPhoto || state.pendingSwapMonth);
}

function isPhotoActionTarget(monthKey) {
  return Boolean(
    state.pendingPhoto || (state.pendingSwapMonth && state.pendingSwapMonth !== monthKey),
  );
}

function handlePendingPhotoAction(monthKey) {
  if (state.pendingPhoto) {
    return assignPendingPhoto(monthKey);
  }
  if (state.pendingSwapMonth) {
    return swapPendingPhoto(monthKey);
  }
  return false;
}

function handlePhotoTargetClick(monthKey, { openPicker = false } = {}) {
  monthInput.value = monthKey;
  if (handlePendingPhotoAction(monthKey)) return true;
  if (openPicker) {
    openPhotoPicker(monthKey);
  } else {
    renderAndSave();
  }
  return false;
}

function assignPendingPhoto(monthKey) {
  setPhoto(monthKey, state.pendingPhoto);
  state.pendingPhoto = "";
  renderAndSave();
  return true;
}

function swapPendingPhoto(targetMonthKey) {
  const sourceMonthKey = state.pendingSwapMonth;
  if (!sourceMonthKey) return false;
  if (sourceMonthKey === targetMonthKey) {
    state.pendingSwapMonth = "";
    renderAndSave();
    return true;
  }

  const sourcePhoto = state.photos[sourceMonthKey];
  const targetPhoto = state.photos[targetMonthKey];
  if (!sourcePhoto) {
    state.pendingSwapMonth = "";
    renderAndSave();
    return true;
  }

  setPhoto(targetMonthKey, sourcePhoto);
  if (targetPhoto) {
    setPhoto(sourceMonthKey, targetPhoto);
  } else {
    removePhoto(sourceMonthKey);
  }
  state.pendingSwapMonth = "";
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
  )}|${state.pendingSwapMonth}`;
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
  photoPanel.classList.toggle("is-assign-target", isPhotoActionTarget(monthInput.value));
  monthPreview.textContent = monthLabel;
}

function renderImageDrawer() {
  app.classList.toggle("has-image-drawer", state.imageDrawerOpen);
  imageDrawer.classList.toggle("is-hidden", !state.imageDrawerOpen);
  imageDrawerButton.setAttribute("aria-pressed", String(state.imageDrawerOpen));
  monthImagesTabButton.setAttribute("aria-pressed", String(state.imageDrawerTab === "images"));
  extraImagesTabButton.setAttribute("aria-pressed", String(state.imageDrawerTab === "extra"));
  if (!state.imageDrawerOpen) return;

  const key = `${state.imageDrawerOpen}|${state.imageDrawerTab}|${monthInput.value}|${photoVersion}|${state.pendingPhoto}|${state.pendingSwapMonth}`;
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

  const actions = document.createElement("div");
  actions.className = "image-actions";

  const assignButton = document.createElement("button");
  assignButton.type = "button";
  assignButton.textContent = "Use photo";
  assignButton.addEventListener("click", () => {
    startPhotoAssignment(photo);
  });

  if (type === "month") {
    const swapButton = document.createElement("button");
    swapButton.type = "button";
    swapButton.textContent = "Swap";
    swapButton.addEventListener("click", () => {
      startPhotoSwap(monthKey);
    });
    actions.append(swapButton);
  }

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

  actions.prepend(assignButton);
  actions.append(removeButton);
  item.append(thumb, meta, actions);
  return item;
}

function renderCalendar(monthDate) {
  const key = [
    monthInput.value,
    showWeekNumbersInput.checked,
    hideOutsideDaysInput.checked,
    showMemberColorsInput.checked,
    showFamilyNamesInput.checked,
    showFamilyNameColumnInput.checked,
    showFamilyBordersInput.checked,
    getEventsSignature(),
    getMembersSignature(),
  ].join("|");
  if (renderCache.calendar === key) return;
  renderCache.calendar = key;

  calendarGrid.innerHTML = "";
  calendarGrid.classList.toggle("no-weeks", !showWeekNumbersInput.checked);
  calendarGrid.classList.toggle("has-family-sections", usesFamilyDaySections());
  calendarGrid.classList.toggle("has-family-name-column", usesFamilyNameColumn());
  renderCalendarGrid(monthDate, calendarGrid);
}

function renderCalendarGrid(monthDate, targetGrid) {
  const hasWeeks = showWeekNumbersInput.checked;
  const hasFamilySections = usesFamilyDaySections();
  const hasFamilyNameColumn = usesFamilyNameColumn();
  targetGrid.style.setProperty("--calendar-week-count", buildCalendarDays(monthDate).length);
  targetGrid.classList.toggle("has-family-sections", hasFamilySections);
  targetGrid.classList.toggle("has-family-name-column", hasFamilyNameColumn);
  targetGrid.classList.toggle("hide-family-names", !showFamilyNamesInput.checked);
  targetGrid.classList.toggle("use-family-line-borders", showFamilyBordersInput.checked);
  if (hasWeeks || hasFamilyNameColumn) {
    const className = hasWeeks && hasFamilyNameColumn
      ? "weekday calendar-leading-header spans-family"
      : "weekday calendar-leading-header";
    targetGrid.append(createCell(className, ""));
  }
  weekdays.forEach((day) => targetGrid.append(createCell("weekday", day)));

  buildCalendarDays(monthDate).forEach((week) => {
    if (hasWeeks) {
      targetGrid.append(renderWeekNumber(week[0]));
    }
    if (hasFamilyNameColumn) {
      targetGrid.append(renderFamilyLabelCell());
    }

    week.forEach((date) => {
      targetGrid.append(renderDay(date, monthDate));
    });
  });
}

function renderWeekNumber(date) {
  const cell = createCell("week-number", "");
  const week = document.createElement("span");
  week.className = "week-number-value";
  week.textContent = getIsoWeek(date);
  cell.append(week);

  return cell;
}

function renderFamilyLabelCell() {
  const cell = createCell("family-label-cell", "");
  cell.style.setProperty("--member-section-count", getFamilySections().length);
  cell.append(renderFamilyLabelSections());
  return cell;
}

function renderFamilyLabelSections() {
  const sections = document.createElement("div");
  sections.className = "family-label-sections";

  getFamilySections().forEach((familySection) => {
    const section = document.createElement("div");
    section.className = "family-label-section";
    section.style.setProperty("--member-color", familySection.color);

    const label = document.createElement("span");
    label.textContent = familySection.label;
    section.append(label);
    sections.append(section);
  });

  return sections;
}

function renderYearOverview(year) {
  const key = [
    year,
    monthInput.value,
    titleInput.value,
    photoVersion,
    Boolean(state.pendingPhoto),
    state.pendingSwapMonth,
    showWeekNumbersInput.checked,
    hideOutsideDaysInput.checked,
    showMemberColorsInput.checked,
    showFamilyNamesInput.checked,
    showFamilyNameColumnInput.checked,
    showFamilyBordersInput.checked,
    getEventsSignature(),
    getMembersSignature(),
  ].join("|");
  if (renderCache.year === key) return;
  renderCache.year = key;

  yearOverview.innerHTML = "";

  Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(year, index, 1);
    yearOverview.append(renderYearMonth(monthDate));
  });
}

function renderYearMonth(monthDate) {
  const monthKey = toMonthKey(monthDate);
  const button = document.createElement("div");
  button.className = "year-month";
  button.setAttribute("role", "button");
  button.setAttribute("tabindex", "0");
  button.setAttribute("aria-label", `Select ${monthFormatter.format(monthDate)}`);
  button.classList.toggle("is-selected", monthKey === monthInput.value);
  button.classList.toggle("is-assign-target", isPhotoActionTarget(monthKey));
  button.addEventListener("click", () => {
    handlePhotoTargetClick(monthKey);
  });
  button.addEventListener("keydown", (event) => {
    if (event.target !== button || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    handlePhotoTargetClick(monthKey);
  });

  const page = renderYearPreviewPage(monthDate);
  const photoPanel = page.querySelector(".year-preview-photo");
  photoPanel.classList.toggle("is-assign-target", isPhotoActionTarget(monthKey));
  photoPanel.setAttribute("role", "button");
  photoPanel.setAttribute("tabindex", "0");
  photoPanel.setAttribute("aria-label", `Choose photo for ${monthFormatter.format(monthDate)}`);
  photoPanel.addEventListener("click", (event) => {
    event.stopPropagation();
    handlePhotoTargetClick(monthKey, { openPicker: true });
  });
  photoPanel.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      handlePhotoTargetClick(monthKey, { openPicker: true });
    }
  });

  button.append(page);
  return button;
}

function renderYearPreviewPage(monthDate) {
  const page = document.createElement("div");
  page.className = "year-preview-page";

  const monthKey = toMonthKey(monthDate);
  const photo = state.photos[monthKey] || "";
  const header = document.createElement("header");
  header.className = "photo-panel year-preview-photo";
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
  grid.classList.toggle("has-family-sections", usesFamilyDaySections());
  grid.classList.toggle("has-family-name-column", usesFamilyNameColumn());
  renderCalendarGrid(monthDate, grid);
  wrap.append(grid);

  page.append(header, wrap);
  return page;
}

function renderDay(date, monthDate) {
  const cell = createCell("day", "");
  const outsideMonth = date.getMonth() !== monthDate.getMonth();
  const hiddenOutside = outsideMonth && hideOutsideDaysInput.checked;
  if (outsideMonth) {
    cell.classList.add("outside");
  }
  if (hiddenOutside) {
    cell.classList.add("is-hidden");
  }

  const events = state.events.filter((item) => eventOccursOn(item, date));
  cell.classList.toggle("has-multiple-events", events.length > 1);
  const hasFamilySections = usesFamilyDaySections() && !hiddenOutside;
  if (hasFamilySections) {
    cell.classList.add("has-member-sections");
    cell.style.setProperty("--member-section-count", getFamilySections().length);
    cell.append(renderFamilyDaySections(events, date));
  }

  const heading = document.createElement("div");
  heading.className = "day-number";
  heading.textContent = date.getDate();
  cell.append(heading);

  const sharedEvents = hasFamilySections
    ? events.filter((event) => !getMember(event.memberId) && !getGeneralMember())
    : events;
  if (sharedEvents.length) {
    const list = document.createElement("div");
    list.className = "events";
    sharedEvents.forEach((event) => list.append(renderCalendarEvent(event, date.getFullYear())));
    cell.append(list);
  }

  return cell;
}

function renderFamilyDaySections(events, date) {
  const sections = document.createElement("div");
  sections.className = "day-member-sections";

  getFamilySections().forEach((familySection) => {
    const section = document.createElement("div");
    section.className = "day-member-section";
    section.style.setProperty("--member-color", familySection.color);

    const sectionEvents = events.filter((event) => eventBelongsToFamilySection(event, familySection));
    if (sectionEvents.length) {
      const list = document.createElement("div");
      list.className = "events";
      sectionEvents.forEach((event) => list.append(renderCalendarEvent(event, date.getFullYear())));
      section.append(list);
    }

    sections.append(section);
  });

  return sections;
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

function usesFamilyDaySections() {
  return showMemberColorsInput.checked && state.members.length > 0;
}

function usesFamilyNameColumn() {
  return usesFamilyDaySections() && showFamilyNameColumnInput.checked;
}

function getFamilySections() {
  return state.members.map((member) => ({
    id: member.id,
    label: member.name,
    color: member.color,
  }));
}

function eventBelongsToFamilySection(event, section) {
  if (event.memberId === section.id) return true;
  const generalMember = getGeneralMember();
  return !getMember(event.memberId) && generalMember?.id === section.id;
}

function getGeneralMember() {
  return state.members.find((member) => member.id === DEFAULT_GENERAL_MEMBER.id);
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
      const member = getMember(event.memberId) || (!getMember(event.memberId) && getGeneralMember());
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
  const generalMember = getGeneralMember();
  eventMemberInput.value = state.members.some((member) => member.id === selectedMember)
    ? selectedMember
    : generalMember?.id || "";

  memberList.innerHTML = "";
  state.members.forEach((member, index) => {
    const item = document.createElement("li");
    item.className = "member-editor";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = member.name;
    nameInput.setAttribute("aria-label", "Family member name");
    nameInput.addEventListener("change", () => {
      updateMember(member.id, { name: nameInput.value.trim() || member.name });
    });

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = member.color;
    colorInput.setAttribute("aria-label", `${member.name} color`);
    colorInput.addEventListener("change", () => {
      updateMember(member.id, { color: colorInput.value });
    });

    const moveUpButton = document.createElement("button");
    moveUpButton.type = "button";
    moveUpButton.textContent = "Up";
    moveUpButton.disabled = index === 0;
    moveUpButton.addEventListener("click", () => moveMember(member.id, -1));

    const moveDownButton = document.createElement("button");
    moveDownButton.type = "button";
    moveDownButton.textContent = "Down";
    moveDownButton.disabled = index === state.members.length - 1;
    moveDownButton.addEventListener("click", () => moveMember(member.id, 1));

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

    item.append(nameInput, colorInput, moveUpButton, moveDownButton, button);
    memberList.append(item);
  });
}

function updateMember(memberId, updates) {
  state.members = state.members.map((member) =>
    member.id === memberId ? { ...member, ...updates } : member,
  );
  renderAndSave();
}

function moveMember(memberId, direction) {
  const index = state.members.findIndex((member) => member.id === memberId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= state.members.length) return;

  const members = [...state.members];
  [members[index], members[nextIndex]] = [members[nextIndex], members[index]];
  state.members = members;
  renderAndSave();
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
      calendarFontSize: calendarFontSizeInput.value,
      calendarTextFont: calendarTextFontInput.value,
      titleFont: titleFontInput.value,
      monthTitleFont: monthTitleFontInput.value,
      calendarLabelFont: calendarLabelFontInput.value,
      paperSize: paperSizeInput.value,
      showWeekNumbers: showWeekNumbersInput.checked,
      hideOutsideDays: hideOutsideDaysInput.checked,
      showMemberColors: showMemberColorsInput.checked,
      showFamilyNames: showFamilyNamesInput.checked,
      showFamilyNameColumn: showFamilyNameColumnInput.checked,
      showFamilyBorders: showFamilyBordersInput.checked,
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
    state.extraPhotos = Array.isArray(saved.extraPhotos)
      ? saved.extraPhotos.slice(-EXTRA_PHOTO_LIMIT)
      : [];

    if (saved.settings) {
      monthInput.value = saved.settings.month || monthInput.value;
      printStartInput.value = saved.settings.printStart || printStartInput.value;
      printEndInput.value = saved.settings.printEnd || printEndInput.value;
      titleInput.value =
        saved.settings.title === "Family Calendar" ? "" : saved.settings.title || titleInput.value;
      accentInput.value = saved.settings.accent || accentInput.value;
      photoHeightInput.value = saved.settings.photoHeight || photoHeightInput.value;
      calendarFontSizeInput.value =
        saved.settings.calendarFontSize || calendarFontSizeInput.value;
      calendarTextFontInput.value =
        saved.settings.calendarTextFont || calendarTextFontInput.value;
      titleFontInput.value = saved.settings.titleFont || titleFontInput.value;
      monthTitleFontInput.value = saved.settings.monthTitleFont || monthTitleFontInput.value;
      calendarLabelFontInput.value =
        saved.settings.calendarLabelFont || calendarLabelFontInput.value;
      paperSizeInput.value = paperSizes[saved.settings.paperSize]
        ? saved.settings.paperSize
        : paperSizeInput.value;
      showWeekNumbersInput.checked = saved.settings.showWeekNumbers ?? showWeekNumbersInput.checked;
      hideOutsideDaysInput.checked = saved.settings.hideOutsideDays ?? hideOutsideDaysInput.checked;
      showMemberColorsInput.checked =
        saved.settings.showMemberColors ?? showMemberColorsInput.checked;
      showFamilyNamesInput.checked = saved.settings.showFamilyNames ?? showFamilyNamesInput.checked;
      showFamilyNameColumnInput.checked =
        saved.settings.showFamilyNameColumn ?? showFamilyNameColumnInput.checked;
      showFamilyBordersInput.checked =
        saved.settings.showFamilyBorders ?? showFamilyBordersInput.checked;
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

class PdfDocument {
  constructor(pageWidth, pageHeight) {
    this.pageWidth = pageWidth;
    this.pageHeight = pageHeight;
    this.objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ];
    this.pages = [];
    this.images = new Map();
  }

  addPage() {
    const page = new PdfPage(this, this.pageWidth, this.pageHeight);
    this.pages.push(page);
    return page;
  }

  addImage(image) {
    const key = hashBinary(image.bytes);
    if (this.images.has(key)) return this.images.get(key);
    const objectNumber = this.objects.length + 1;
    this.objects.push({
      dict: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>`,
      stream: image.bytes,
    });
    const name = `Im${this.images.size + 1}`;
    const entry = { name, objectNumber };
    this.images.set(key, entry);
    return entry;
  }

  toBlob() {
    const kids = [];
    this.pages.forEach((page) => {
      const content = page.commands.join("\n");
      const contentObject = this.objects.length + 1;
      this.objects.push({
        dict: `<< /Length ${content.length} >>`,
        stream: content,
      });

      const imageResources = [...page.images]
        .map((image) => `/${image.name} ${image.objectNumber} 0 R`)
        .join(" ");
      const resources = `<< /Font << /Helvetica 3 0 R /Helvetica-Bold 4 0 R >>${
        imageResources ? ` /XObject << ${imageResources} >>` : ""
      } >>`;
      const pageObject = this.objects.length + 1;
      this.objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth.toFixed(2)} ${this.pageHeight.toFixed(
          2,
        )}] /Resources ${resources} /Contents ${contentObject} 0 R >>`,
      );
      kids.push(`${pageObject} 0 R`);
    });

    this.objects[1] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>`;

    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [0];
    this.objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n`;
      if (typeof object === "string") {
        pdf += `${object}\n`;
      } else {
        pdf += `${object.dict}\nstream\n${object.stream}\nendstream\n`;
      }
      pdf += "endobj\n";
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${this.objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([binaryToBytes(pdf)], { type: "application/pdf" });
  }
}

class PdfPage {
  constructor(document, width, height) {
    this.document = document;
    this.width = width;
    this.height = height;
    this.commands = [];
    this.images = new Set();
  }

  fill(color) {
    this.commands.push(`${rgb(color)} rg`);
  }

  stroke(color) {
    this.commands.push(`${rgb(color)} RG`);
  }

  lineWidth(width) {
    this.commands.push(`${fmt(width)} w`);
  }

  rect(x, y, width, height, mode) {
    this.commands.push(`${fmt(x)} ${fmt(this.height - y - height)} ${fmt(width)} ${fmt(height)} re ${mode}`);
  }

  text(text, x, y, size, font) {
    const fontName = font === "Helvetica-Bold" ? "Helvetica-Bold" : "Helvetica";
    this.commands.push(
      `BT /${fontName} ${fmt(size)} Tf ${fmt(x)} ${fmt(this.height - y)} Td (${escapePdfText(text)}) Tj ET`,
    );
  }

  textRotated(text, x, y, size, font) {
    const fontName = font === "Helvetica-Bold" ? "Helvetica-Bold" : "Helvetica";
    this.commands.push(
      `BT /${fontName} ${fmt(size)} Tf 0 1 -1 0 ${fmt(x)} ${fmt(this.height - y)} Tm (${escapePdfText(text)}) Tj ET`,
    );
  }

  imageCover(image, x, y, width, height) {
    const pdfImage = this.document.addImage(image);
    this.images.add(pdfImage);
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;
    this.commands.push("q");
    this.commands.push(`${fmt(x)} ${fmt(this.height - y - height)} ${fmt(width)} ${fmt(height)} re W n`);
    this.commands.push(
      `${fmt(drawWidth)} 0 0 ${fmt(drawHeight)} ${fmt(drawX)} ${fmt(this.height - drawY - drawHeight)} cm /${
        pdfImage.name
      } Do`,
    );
    this.commands.push("Q");
  }
}

function mmToPt(mm) {
  return (mm * 72) / 25.4;
}

function fmt(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function mixHexColors(color, background, ratio) {
  const foregroundRgb = parseHexColor(color);
  const backgroundRgb = parseHexColor(background);
  if (!foregroundRgb || !backgroundRgb) return color;

  const mixed = foregroundRgb.map((value, index) =>
    Math.round(value * ratio + backgroundRgb[index] * (1 - ratio)),
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function parseHexColor(color) {
  const normalized = String(color).trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
}

function rgb(color) {
  const normalized = color.startsWith("#") ? color.slice(1) : color;
  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;
  return `${fmt(red)} ${fmt(green)} ${fmt(blue)}`;
}

function escapePdfText(text) {
  return String(text)
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function base64ToBinary(base64) {
  return atob(base64);
}

function binaryToBytes(binary) {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function hashBinary(binary) {
  let hash = 2166136261;
  for (let index = 0; index < binary.length; index += 1) {
    hash ^= binary.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${binary.length}:${hash >>> 0}`;
}

function getJpegSize(bytes) {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes.charCodeAt(offset) !== 0xff) return null;
    const marker = bytes.charCodeAt(offset + 1);
    const length = (bytes.charCodeAt(offset + 2) << 8) + bytes.charCodeAt(offset + 3);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: (bytes.charCodeAt(offset + 5) << 8) + bytes.charCodeAt(offset + 6),
        width: (bytes.charCodeAt(offset + 7) << 8) + bytes.charCodeAt(offset + 8),
      };
    }
    offset += 2 + length;
  }
  return null;
}

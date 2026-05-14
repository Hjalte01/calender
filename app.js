const state = {
  events: [],
  members: [],
  photoUrl: "",
};

const monthInput = document.querySelector("#monthInput");
const titleInput = document.querySelector("#titleInput");
const photoInput = document.querySelector("#photoInput");
const accentInput = document.querySelector("#accentInput");
const photoHeightInput = document.querySelector("#photoHeightInput");
const showWeekNumbersInput = document.querySelector("#showWeekNumbersInput");
const hideOutsideDaysInput = document.querySelector("#hideOutsideDaysInput");
const showMemberColorsInput = document.querySelector("#showMemberColorsInput");
const memberNameInput = document.querySelector("#memberNameInput");
const memberColorInput = document.querySelector("#memberColorInput");
const addMemberButton = document.querySelector("#addMemberButton");
const memberList = document.querySelector("#memberList");
const eventMemberInput = document.querySelector("#eventMemberInput");
const eventInput = document.querySelector("#eventInput");
const addEventButton = document.querySelector("#addEventButton");
const icsInput = document.querySelector("#icsInput");
const eventList = document.querySelector("#eventList");
const printButton = document.querySelector("#printButton");
const clearButton = document.querySelector("#clearButton");
const photoPreview = document.querySelector("#photoPreview");
const photoPanel = document.querySelector(".photo-panel");
const titlePreview = document.querySelector("#titlePreview");
const monthPreview = document.querySelector("#monthPreview");
const calendarGrid = document.querySelector("#calendarGrid");

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

init();

function init() {
  const now = new Date();
  monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  monthInput.addEventListener("change", render);
  titleInput.addEventListener("input", render);
  accentInput.addEventListener("input", render);
  photoHeightInput.addEventListener("input", render);
  showWeekNumbersInput.addEventListener("change", render);
  hideOutsideDaysInput.addEventListener("change", render);
  showMemberColorsInput.addEventListener("change", render);
  photoInput.addEventListener("change", handlePhoto);
  addMemberButton.addEventListener("click", addMember);
  addEventButton.addEventListener("click", addTypedEvent);
  icsInput.addEventListener("change", handleIcsImport);
  printButton.addEventListener("click", () => window.print());
  clearButton.addEventListener("click", () => {
    state.events = [];
    render();
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
  render();
}

function handlePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = URL.createObjectURL(file);
  render();
}

function addTypedEvent() {
  const parsed = parseManualEvent(eventInput.value);
  if (!parsed) return;
  state.events.push(parsed);
  eventInput.value = "";
  render();
}

function parseManualEvent(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(.+)$/);
  if (!match) {
    eventInput.setCustomValidity("Use: YYYY-MM-DD Text /flag_dk");
    eventInput.reportValidity();
    return null;
  }

  eventInput.setCustomValidity("");
  return normalizeEvent(match[1], match[2], eventMemberInput.value);
}

function normalizeEvent(date, text, memberId = "") {
  const tokens = [...text.matchAll(/\/flag_([a-z]+)/g)].map((match) => match[1]);
  const birthYear = tokens.length ? Number(date.slice(0, 4)) : null;
  return {
    id: crypto.randomUUID(),
    date,
    text: text.replace(/\/flag_[a-z]+/g, "").replace(/\s+/g, " ").trim(),
    flags: tokens,
    memberId,
    birthYear,
  };
}

async function handleIcsImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  state.events.push(...parseIcs(text));
  icsInput.value = "";
  render();
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

      const isYearly = /RRULE:.*FREQ=YEARLY/.test(block);
      const omitsYear = /X-APPLE-OMIT-YEAR/.test(block);
      const date = parseIcsDate(dateValue, currentYear, isYearly || omitsYear);
      if (!date) return null;

      return normalizeEvent(date, `${unescapeIcs(summary)} /flag_dk`);
    })
    .filter(Boolean);
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

function render() {
  document.documentElement.style.setProperty("--accent", accentInput.value);
  document.documentElement.style.setProperty("--photo-height", `${photoHeightInput.value}%`);

  titlePreview.textContent = titleInput.value || "Calendar";
  photoPreview.src = state.photoUrl;
  photoPanel.classList.toggle("has-photo", Boolean(state.photoUrl));

  const selectedMonth = getSelectedMonth();
  monthPreview.textContent = monthFormatter.format(selectedMonth);

  renderCalendar(selectedMonth);
  renderEventList();
  renderMembers();
}

function getSelectedMonth() {
  const [year, month] = monthInput.value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function renderCalendar(monthDate) {
  calendarGrid.innerHTML = "";
  calendarGrid.classList.toggle("no-weeks", !showWeekNumbersInput.checked);

  if (showWeekNumbersInput.checked) {
    calendarGrid.append(createCell("weekday", ""));
  }
  weekdays.forEach((day) => calendarGrid.append(createCell("weekday", day)));

  buildCalendarDays(monthDate).forEach((week) => {
    if (showWeekNumbersInput.checked) {
      calendarGrid.append(createCell("week-number", getIsoWeek(week[0])));
    }

    week.forEach((date) => {
      calendarGrid.append(renderDay(date, monthDate));
    });
  });
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
  if (event.flags.length && event.birthYear && event.birthYear < date.getFullYear()) {
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
        render();
      });

      item.append(text, button);
      eventList.append(item);
    });
}

function renderMembers() {
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
      render();
    });

    item.append(pill, button);
    memberList.append(item);
  });
}

function getMember(memberId) {
  return state.members.find((member) => member.id === memberId);
}

function buildCalendarDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
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

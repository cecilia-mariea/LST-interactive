import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

async function loadData(day) {
  let path = `./lib/2024_${String(day).padStart(3, "0")}_LST.json`;
  const data = await d3.json(path);
  return data;
}

let dayToDisplay = 1; // in julian days

function convertDate(jDay) {
  // convert julian day to month/day/year format for 2024
  const janFirst = new Date("2024-01-01T00:00:00Z");
  const targetDate = new Date(janFirst.setDate(janFirst.getDate() + jDay));
  const formatFullMonth = d3.timeFormat("%B");

  const month = formatFullMonth(targetDate); // Months are zero-indexed
  const day = targetDate.getDate();
  return `${month} ${day}, 2024`;
}

function displayDate(jDay) {
  const dateStr = convertDate(jDay);
  d3.select("#date").text(`Date: ${dateStr}`);
}

function renderMap(day) {
  const data = loadData(day);
  const svg = d3.select("svg");
}

function update(newDay) {
  displayDate(newDay);
  renderMap(newDay);
  dayToDisplay = newDay;
}

update(dayToDisplay);

d3.select("#date-slider").on("input", function () {
  const newDay = +this.value;
  update(newDay);
});

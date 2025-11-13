import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// config
let dayToDisplay = 1; // in julian days
const width = 800;
const height = 500;
const margin = { top: 20, right: 20, bottom: 40, left: 60 };

const minx = -140,
  maxx = -65;
const miny = 20,
  maxy = 55;

//  useable area
const x = d3
  .scaleLinear()
  .domain([minx, maxx])
  .range([margin.left, width - margin.right]);
const y = d3
  .scaleLinear()
  .domain([miny, maxy])
  .range([height - margin.bottom, margin.top]);

// data formating
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

// load data
const numDays = 129;
async function preloadData() {
  const filePromises = d3.range(1, numDays + 1).map((day) => {
    const path = `./lib_filtered/2024_${String(day).padStart(3, "0")}_LST.json`;
    return d3
      .json(path)
      .then((file) => ({
        day,
        data: file.data,
      }))
      .catch(() => null);
  });
  const results = await Promise.all(filePromises);
  return results.filter((d) => d !== null);
}

// start map render
const svg = d3.select("svg");

svg
  .append("defs")
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", x(minx))
  .attr("y", y(maxy))
  .attr("width", x(maxx) - x(minx))
  .attr("height", y(miny) - y(maxy));

// axes
const xAxis = d3.axisBottom(x).ticks(10);
const yAxis = d3.axisLeft(y).ticks(5);

svg
  .append("g")
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(xAxis);

svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

const mapGroup = svg.append("g").attr("clip-path", "url(#clip)");

// Use a fixed color domain (Kelvin)
const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([250, 300]);

// load map
function renderMap(day) {
  const dayEntry = allData.find((d) => d.day === day);
  if (!dayEntry) return;
  let data = dayEntry.data;
  const rectSize = 8;
  const rects = mapGroup
    .selectAll("rect")
    .data(data, (d) => `${d.lon}, ${d.lat}`);

  rects.join(
    (enter) =>
      enter
        .append("rect")
        .attr("x", (d) => d.screenX)
        .attr("y", (d) => d.screenY)
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("fill", (d) => color(d.LST)),
    (update) =>
      update
        .transition()
        .duration(25)
        .attr("fill", (d) => color(d.LST)),
    (exit) => exit.remove()
  );
}

// update day
function update(newDay) {
  displayDate(newDay);
  renderMap(newDay);
  dayToDisplay = newDay;
}

// input slider
d3.select("#date-slider").on("input", function () {
  const newDay = +this.value;
  update(newDay);
});

// legend
function drawLegend(color) {
  const legendWidth = 300;
  const legendHeight = 10;

  const legendSvg = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${width - legendWidth - 50}, ${height - 40})`
    );

  // Create a linear gradient
  const defs = legendSvg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  const [min, max] = color.domain();
  const steps = d3.range(0, 1.01, 0.1);
  steps.forEach((t) => {
    gradient
      .append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", color(min + t * (max - min)));
  });

  // Draw the bar
  legendSvg
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Add numeric axis for temperature
  const legendScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat((d) => `${d.toFixed(0)} K`);

  legendSvg
    .append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(legendAxis);
}
drawLegend(color);

let allData = [];
// init
async function init() {
  allData = await preloadData();
  allData.forEach((day) => {
    day.data.forEach((d) => {
      d.screenX = x(d.lon);
      d.screenY = y(d.lat);
    });
  });
  update(dayToDisplay);
}

init();

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// config
let dayToDisplay = 1; // in julian days
const canvas = document.getElementById("mapCanvas");
const context = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

const minx = -140,
  maxx = -65;
const miny = 20,
  maxy = 55;

//  useable area
const x = d3.scaleLinear().domain([minx, maxx]).range([0, width]);
const y = d3.scaleLinear().domain([miny, maxy]).range([height, 0]);

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
const numDays = 129; // number of total files
async function preloadData() {
  const filePromises = d3.range(1, numDays + 1).map((day) => {
    const path = `./lib/2024_${String(day).padStart(3, "0")}_LST.json`;
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

// Use a fixed color domain (Kelvin)
const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([250, 300]);

// map
function drawCanvas(data) {
  context.clearRect(0, 0, width, height);
  const rectSize = 8;
  data.forEach((d) => {
    context.fillStyle = color(d.LST);
    context.fillRect(x(d.lon), y(d.lat), rectSize, rectSize);
  });
}
// update day
function update(newDay) {
  displayDate(newDay);
  const dayEntry = allData.find((d) => d.day === newDay);
  if (dayEntry) drawCanvas(dayEntry.data);
}

// input slider
d3.select("#date-slider").on("input", function () {
  const newDay = +this.value;
  update(newDay);
});

// legend
function drawLegend(color) {
  const legendWidth = 350;
  const legendHeight = 30;

  const legendSvg = d3
    .select("#legend")
    .attr("width", legendWidth)
    .attr("height", legendHeight);

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

let allData = [];
// init
async function init() {
  allData = await preloadData();
  drawLegend(color);
  update(dayToDisplay);
}

init();

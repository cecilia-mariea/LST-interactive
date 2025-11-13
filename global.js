import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let dayToDisplay = 1; // in julian days
const width = 800;
const height = 500;
const margin = { top: 20, right: 20, bottom: 40, left: 60 };

const minx = -140,
  maxx = -65;
const miny = 20,
  maxy = 55;

// axes & scale
const x = d3
  .scaleLinear()
  .domain([minx, maxx])
  .range([margin.left, width - margin.right]);
const y = d3
  .scaleLinear()
  .domain([miny, maxy])
  .range([height - margin.bottom, margin.top]);

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
const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([250, 330]);

async function renderMap(day) {
  // load data
  let visibleData;
  let path = `./lib/2024_${String(day).padStart(3, "0")}_LST.json`;

  try {
    const file = await d3.json(path);
    const jsonData = file.data;
    visibleData = jsonData.filter(
      (d) => d.lon >= minx && d.lon <= maxx && d.lat >= miny && d.lat <= maxy
    );

    const sampleFraction = 0.6;
    const subset = visibleData.filter(() => Math.random() < sampleFraction);

    const rectSize = 8;
    mapGroup.selectAll("rect").remove();

    mapGroup
      .selectAll("rect")
      .data(subset)
      .join("rect")
      .attr("x", (d) => x(d.lon))
      .attr("y", (d) => y(d.lat))
      .attr("width", rectSize)
      .attr("height", rectSize)
      .attr("fill", (d) => color(d.LST));
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
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

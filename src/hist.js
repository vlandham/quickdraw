
import * as d3 from 'd3';

export default function createHist() {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const width = 900;
  const height = 400;
  let g = null;
  let data = [];

  const xScale = d3.scaleLinear()
    .rangeRound([0, width])
    .domain([0, 25]);

  const yScale = d3.scaleLinear()
    .range([height, 0]);

  const chart = function wrapper(selection, rawData) {
    data = rawData;

    const svg = d3.select(selection).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    setupScales();
    update();
  };

  function setupScales() {
    const xMins = [];
    const xMaxs = [];
    const yMins = [];
    const yMaxs = [];
    data.ids.forEach((id) => {
      xMins.push(d3.min(data[id].hist, d => d.x1));
      xMaxs.push(d3.max(data[id].hist, d => d.x1));
      yMins.push(d3.min(data[id].hist, d => d.freq));
      yMaxs.push(d3.max(data[id].hist, d => d.freq));
    });
    // const xExtent = d3.extent(data.dog.hist, d => d.x1);
    xScale.domain([0, d3.max(xMaxs)]);

    // const freqExtent = d3.extent(data.dog.hist, d => d.freq);
    yScale.domain([0, d3.max(yMaxs)]);
  }

  function update() {
    data.ids.forEach((id) => {
      const idG = g.append('g')
        .classed(id, true);
      const bar = idG.selectAll('.bar')
        .data(data[id].hist)
        .enter().append('g')
        .classed('bar', true)
        .classed(id, true)
        .attr('transform', d => `translate(${xScale(d.x0)},${yScale(d.freq)})`);

      bar
        .append('rect')
        .attr('x', 1)
        .attr('width', d => xScale(d.x1) - xScale(d.x0))
        .attr('height', d => height - yScale(d.freq));
    });
  }

  return chart;
}

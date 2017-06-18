
import * as d3 from 'd3';

export default function createDraw() {
  let width = 900;
  let height = 900;
  const margin = { top: 10, right: 20, bottom: 10, left: 20 };
  let g = null;
  let data = [];
  let limit = null;
  let rowCount = 14;
  let panelWidth = 64;


  const line = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis);

  const chart = function wrapper(selection, rawData) {
    data = rawData;
    filterData();
    rowCount = Math.floor(width / panelWidth);
    // console.log(rowCount);
    height = (Math.floor(data.length / rowCount)) * panelWidth;
    if (data.length % rowCount > 0) {
      height += panelWidth;
    }


    const svg = d3.select(selection).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    update();
  };

  function filterData() {
    if (limit) {
      data = data.slice(0, limit);
    }
  }

  function update() {
    const panels = g.selectAll('.panel')
      .data(data);
    const panelsE = panels.enter()
      .append('g')
      .attr('class', 'panel')
      .attr('transform', (d, i) => {
        const x = (i % rowCount) * panelWidth;
        const y = Math.floor(i / rowCount) * panelWidth;
        return `translate(${(x)},${y}) scale(0.25)`;
      });

    panelsE.selectAll('.stroke')
      .data(d => d.drawing)
      .enter()
      .append('path')
      .classed('stroke', true)
      .style('fill', 'none')
      .style('stroke', '#111')
      .style('stroke-width', '2')
      .attr('d', line);
  }

  chart.limit = function setLimit(value) {
    if (!arguments.length) { return limit; }
    limit = value;
    return this;
  };

  chart.rowCount = function setRowCount(value) {
    if (!arguments.length) { return rowCount; }
    rowCount = value;
    return this;
  };

  chart.width = function setWidth(value) {
    if (!arguments.length) { return width; }
    width = value;
    return this;
  };

  chart.panelWidth = function setPanelWidth(value) {
    if (!arguments.length) { return panelWidth; }
    panelWidth = value;
    return this;
  };

  return chart;
}

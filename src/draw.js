
import * as d3 from 'd3';

export default function createDraw() {
  const width = 900;
  const height = 900;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  let g = null;
  let data = [];

  const line = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis);

  const chart = function wrapper(selection, rawData) {
    data = rawData;

    const svg = d3.select(selection).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    update();
  };

  function update() {
    const panels = g.selectAll('.panel')
      .data(data);
    const panelsE = panels.enter()
      .append('g')
      .attr('class', 'panel')
      .attr('transform', (d, i) => {
        const x = (i % 14) * 64;
        const y = Math.floor(i / 14) * 64;
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

  chart.limit = function(_) {
    
  }

  return chart;
}

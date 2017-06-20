
import * as d3 from 'd3';

export default function createDraw() {
  let width = 900;
  let height = 900;
  const margin = { top: 10, right: 20, bottom: 10, left: 20 };
  let g = null;
  let svg = null;
  let data = [];
  let selector = null;
  let limit = 14;
  let rowCount = 14;
  let panelWidth = 64;
  const titleHeight = 15;


  const line = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis);

  const chart = function wrapper(selection) {
    svg = d3.select(selection).append('svg');

    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  };

  function filterData() {
    // if (limit) {
    //   data = data.slice(0, limit);
    // }
  }

  function update() {
    rowCount = limit;
    // console.log(rowCount);
    // height = (Math.floor(data.length / rowCount)) * panelWidth;
    height = data.length * (panelWidth + titleHeight);

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    let rows = g.selectAll('.row')
      .data(data);

    rows.selectAll('.panel').remove();
    rows.selectAll('.row-title').remove();

    const rowsE = rows.enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', (d, i) => `translate(${0},${(i * panelWidth) + ((i + 1) * titleHeight)})`);

    rows = rows.merge(rowsE);

    rows
      .append('text')
      .attr('class', 'row-title')
      .attr('dy', -10)
      .text(d => `${d.key} drawn in ${d.x}-${+d.x + 1} seconds`);

    const panels = rows.selectAll('.panel')
      .data(d => d.drawings.slice(0, limit));

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

  // function update() {
  //   filterData();
  //   rowCount = Math.floor(width / panelWidth);
  //   // console.log(rowCount);
  //   height = (Math.floor(data.length / rowCount)) * panelWidth;
  //   if (data.length % rowCount > 0) {
  //     height += panelWidth;
  //   }
  //   svg
  //     .attr('width', width + margin.left + margin.right)
  //     .attr('height', height + margin.top + margin.bottom);
  //   const panels = g.selectAll('.panel')
  //     .data(data);
  //   const panelsE = panels.enter()
  //     .append('g')
  //     .attr('class', 'panel')
  //     .attr('transform', (d, i) => {
  //       const x = (i % rowCount) * panelWidth;
  //       const y = Math.floor(i / rowCount) * panelWidth;
  //       return `translate(${(x)},${y}) scale(0.25)`;
  //     });
  //
  //   panelsE.selectAll('.stroke')
  //     .data(d => d.drawing)
  //     .enter()
  //     .append('path')
  //     .classed('stroke', true)
  //     .style('fill', 'none')
  //     .style('stroke', '#111')
  //     .style('stroke-width', '2')
  //     .attr('d', line);
  // }

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

  chart.drawings = function setDrawings(value) {
    if (!arguments.length) { return data; }
    data = value;
    update();
    return this;
  };

  chart.selector = function setSelector(value) {
    if (!arguments.length) { return selector; }
    selector = value;
    return this;
  };

  return chart;
}

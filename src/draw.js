
import * as d3 from 'd3';

function capitalizeTxt(txt) {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

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
  let showTitle = true;
  const titleHeight = 30;
  let showingSecs = true;
  let animate = false;


  const line = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis);

  const chart = function wrapper(selection) {
    svg = d3.select(selection).select('svg');
    if (svg.size() === 0) {
      svg = d3.select(selection).append('svg')
        .attr('height', 100);
    }

    g = svg.select('.root-group');

    if (g.size() === 0) {
      g = svg.append('g')
        .attr('class', 'root-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }
  };

  function update() {
    rowCount = limit;
    let tHeight = titleHeight;
    if (!showTitle) {
      tHeight = 0;
    }

    height = data.length * (panelWidth + tHeight);

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
      .attr('transform', (d, i) => `translate(${0},${(i * panelWidth) + ((i + 1) * tHeight)})`);

    rows = rows.merge(rowsE);

    if (showTitle) {
      rows
        .append('text')
        .attr('class', 'row-title')
        .attr('dy', -10)
        .text(d => showingSecs ? `${capitalizeTxt(d.key)} drawn in ${d.x}-${+d.x + 1} seconds` : `${capitalizeTxt(d.key)} drawn with ${d.x} stroke${(+d.x === 1) ? '' : 's'}`);
    }

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

    const paths = panelsE.selectAll('.stroke')
      .data(d => d.drawing)
      .enter()
      .append('path')
      .classed('stroke', true)
      .style('fill', 'none')
      .style('stroke', '#111')
      .style('stroke-width', '2')
      .attr('d', line);

    if (animate) {
      paths
        .each(function (d, i, j) {
          d.totalLength = this.getTotalLength();
          d.pathCount = j.length;
        }).attr('stroke-dasharray', d => d.totalLength + ' ' + d.totalLength)
        .attr('stroke-dashoffset', d => d.totalLength)
        .transition()
          .duration(800)
          .delay((d, i) => (d.pathCount - (i)) * 800)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);
    }
  }

  function reanimate() {
    svg.selectAll('.panel').selectAll('.stroke')
    .each(function (d, i, j) {
      d.totalLength = this.getTotalLength();
      d.pathCount = j.length;
    }).attr('stroke-dasharray', d => d.totalLength + ' ' + d.totalLength)
    .attr('stroke-dashoffset', d => d.totalLength)
    .transition()
      .duration(400)
      .delay((d, i) => (d.pathCount - (i + 1)) * 400)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);
  }

  chart.reanimate = function setReanimate() {
    reanimate();
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

  chart.showTitle = function setShowTitle(value) {
    if (!arguments.length) { return showTitle; }
    showTitle = value;
    return this;
  };

  chart.showingSecs = function setShowingSecs(value) {
    if (!arguments.length) { return showingSecs; }
    showingSecs = value;
    return this;
  };
  chart.animate = function setAnimate(value) {
    if (!arguments.length) { return animate; }
    animate = value;
    return this;
  };

  return chart;
}

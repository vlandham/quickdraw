
import * as d3 from 'd3';

export default function createHist() {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  let width = 900;
  let height = 400;
  let g = null;
  let bar = null;
  let data = [];
  let overlap = true;
  let xDomain = null;

  const xScale = d3.scaleLinear();

  const yScale = d3.scaleLinear();

  const chart = function wrapper(selection, rawData) {
    data = rawData;
    setupScales();

    if (overlap) {
      setupSvg(selection);
    }

    update(selection);
  };

  function setupScales() {
    const xMins = [];
    const xMaxs = [];
    const yMins = [];
    const yMaxs = [];
    data.keys.forEach((id) => {
      xMins.push(d3.min(data[id].hist, d => d.x1));
      xMaxs.push(d3.max(data[id].hist, d => d.x1));
      yMins.push(d3.min(data[id].hist, d => d.freq));
      yMaxs.push(d3.max(data[id].hist, d => d.freq));
      // data[id].hist.forEach(h => h.key = id);
    });

    // xScale.domain([0, d3.max(xMaxs)]);

    if (!xDomain) {
      xDomain = [0, d3.max(xMaxs)];
    }

    xScale
      .rangeRound([0, width])
      .domain(xDomain);
      // .domain([0, d3.max(xMaxs)]);

    yScale
      .range([height, 0])
      .domain([0, d3.max(yMaxs)]);
  }

  function setupSvg(selection) {
    const svg = d3.select(selection).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale));
  }

  function update(selection) {
    let barData = [];
    data.keys.forEach((id) => {
      barData = barData.concat(data[id].hist);
    });

    // draw background bars
    const x0s = d3.set(barData, d => d.x0);

    g.selectAll('.background')
      .data(x0s.values())
      .enter()
      .append('rect')
      .attr('class', 'background')
      .attr('fill', 'white')
      .attr('x', d => xScale(+d))
      .attr('y', 0)
      .attr('width', d => xScale(+d + 1) - xScale(+d))
      .attr('height', height)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);

    // loop through all keys
    data.keys.forEach((id) => {
      if (!overlap) {
        setupSvg(selection);
      }

      const idG = g.append('g')
        .classed(id, true);
      bar = idG.selectAll('.bar')
        .data(data[id].hist, d => id + d.x0)
        .enter().append('g')
        .classed('bar', true)
        .classed(id, true)
        .attr('transform', d => `translate(${xScale(d.x0)},${yScale(d.freq)})`);

      bar
        .append('rect')
        .attr('x', 1)
        .attr('opacity', 0.6)
        .attr('width', d => xScale(d.x1) - xScale(d.x0))
        .attr('height', d => height - yScale(d.freq))
        .attr('pointer-events', 'none');
    });
  }

  function mouseover(d) {
    d3.selectAll('.bar').filter(b => b.x0 === +d)
      .classed('active', true);
  }

  function mouseout() {
    d3.selectAll('.bar')
      .classed('active', false);
  }

  chart.width = function setWidth(value) {
    if (!arguments.length) { return width; }
    width = value;
    return this;
  };

  chart.overlap = function setOverlap(value) {
    if (!arguments.length) { return overlap; }
    overlap = value;
    return this;
  };

  chart.height = function setHeight(value) {
    if (!arguments.length) { return height; }
    height = value;
    return this;
  };

  chart.xDomain = function setX(value) {
    if (!arguments.length) { return xDomain; }
    xDomain = value;
    return this;
  };

  return chart;
}

import * as d3 from 'd3';
import createDraw from './draw';
import beeswarm from './util/beeswarm';

export default function createSwarm() {
  let width = 780;
  let height = 750;
  const margin = { top: 20, right: 50, bottom: 50, left: 40 };
  let g = null;
  let svg = null;
  let data = [];
  // const types = d3.set();
  const radius = 12;
  const scale = radius / 255;

  let showTypes = true;

  const typeColors = {
    animal: '#FFA726',
    food: '#EF5350',
    nature: '#9CCC65',
    location: '#26A69A',
    vehicle: '#29B6F6',
    body_part: '#A1887F',
    abstract: '#7E57C2',
    object: '#BDBDBD',
  };

  const line = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis);

  let positionKey = 'd_draw_md';

  const xScale = d3.scaleLinear();

  const draw = createDraw();

  const chart = function wrapper(selection, drawSelection, rawData) {
    data = fixData(rawData);

    draw.showTitle(false).animate(false).showingSecs(false)(drawSelection);

    svg = d3.select(selection).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // TODO: g is global - but dangerous.
    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'legend')
      .attr('pointer-events', 'none')
      .attr('transform', `translate(${width - 100},${0})`);

    update();
  };

  function fixData(rdata) {
    rdata.forEach(d => {
      d.key = d.word;
      // d.icon = d.drawings[0];
      d.drawings = d.drawings.map(d => ({ drawing: d }))
      d.iconIndex = 0;

      // types.add(d.type);
    });
    return rdata;
  }

  function suffixFor(key) {
    return key === 'scount_me' ? ' strokes' : ' secs';
  }

  function updateScales() {
    const xExtent = d3.extent(data, d => d[positionKey]);
    xScale.domain(xExtent).range([0, width]);
  }

  function updateSwarm() {
    return beeswarm()
      .data(data)
      .distributeOn(d => xScale(d[positionKey]))
      .radius(radius)
      .orientation('horizontal')
      .side('symetric')
      .arrange();
  }

  function createLegend() {

    const legend = g.select('.legend')
      .selectAll('.key')
      .data(Object.keys(typeColors))

    const legendE = legend.enter()
      .append('g')
      .attr('class', 'key')
      .attr('transform', (d, i) => `translate(${-margin.top},${((radius + 5) * i)})`);

    legendE.append('circle')
      .attr('r', radius / 2)
      .attr('fill', d => colorFor(d))
      .attr('opacity', 0.8)

    legendE.append('text')
      .attr('x', radius + 5)
      .attr('dy', 5)
      .text(d => d.replace('_', ' '));

  }

  function update() {
    updateScales();
    const swarm = updateSwarm();

    let doodle = g.selectAll('.doodle')
      .data(swarm, d => d.datum.word)

    const doodleE = doodle.enter()
      .append('g')
      .attr('class', 'doodle')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout)
      .on('click', mouseclick);

    doodleE.append('circle')
      .attr('class', 'background')
      .attr('r', radius)
      .attr('fill', 'white')
      .attr('stroke', '#777')
      .attr('stroke-width', '1')
      .attr('opacity', 0.8);

    const panel = doodleE.append('g')
      .attr('class', 'panel')
      .attr('transform', `translate(${-radius / 2}, ${-radius / 2}) scale(${scale})`)

    const paths = panel.selectAll('.stroke')
        .data(d => d.datum.drawings[d.datum.iconIndex].drawing)
        .enter()
        .append('path')
        .classed('stroke', true)
        .style('fill', 'none')
        .style('pointer-events', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 8)
        .attr('d', line);


    doodle.merge(doodleE)
      .transition()
      .duration(500)
      .attr('transform', d => `translate(${d.x}, ${(height / 2) + d.y})`);

    updateFill();
  }

  function colorFor(type) {
    if (!showTypes) {
      return 'white';
    }

    return typeColors[type];
  }

  function updateFill() {
    g.selectAll('.doodle').selectAll('.background')
      .transition()
      .duration(500)
      .attr('fill', d => colorFor(d.datum.type))

    if (showTypes) {
      createLegend();
    }
  }

  function mouseover(d) {
    const gr = d3.select(this);
    gr.raise();

    const expandR = radius * 3;

    gr.select('.background')
      .transition()
      .duration(20)
      .attr('opacity', 0.0)
      .attr('r', expandR)
      .attr('stroke-width', 0);

    gr.insert('circle', '.background')
      .attr('opacity', 0.8)
      .attr('class', 'temp-background')
      .attr('fill', colorFor(d.datum.type))
      .attr('pointer-events', 'none')
      .attr('r', expandR * 2)
      .attr('stroke-width', 0);

    gr.select('.panel')
      .attr('transform', `translate(${-expandR}, ${-expandR}) scale(${((expandR * 2) / 255)})`);

    gr.append('text')
      .attr('x', 0)
      .attr('class', 'dot-text')
      .attr('pointer-events', 'none')
      .attr('y', expandR + 10)
      .attr('text-anchor', 'middle')
      .text(d.datum.word);

    gr.append('text')
      .attr('x', 0)
      .attr('class', 'dot-text')
      .attr('pointer-events', 'none')
      .attr('y', expandR + 25)
      .attr('text-anchor', 'middle')
      .text(d.datum[positionKey] + suffixFor(positionKey));


    //console.log(d.datum)
    // const animalDrawings = bKeys.map(k => ({ key: k, drawings: data[k][drawingsKey][d] || [], x: d }));
    draw.drawings([d.datum]);
  }

  function mouseout() {
    const gr = d3.select(this);
    gr.selectAll('.dot-text')
      .remove();

    gr.select('.temp-background')
      .remove();

    gr.select('.panel')
      .transition()
      .duration(200)
      .attr('transform', `translate(${-radius / 2}, ${-radius / 2}) scale(${scale})`);

    gr.select('.background')
      .transition()
      .duration(20)
      .attr('r', radius)
      .attr('opacity', 0.8)
      .attr('stroke-width', 1);
  }

  function mouseclick(d) {
    d.datum.iconIndex = (d.datum.iconIndex + 1) % d.datum.drawings.length;
    const gr = d3.select(this);
    gr.select('.panel')
      .selectAll('.stroke').remove();
    gr.select('.panel')
      .selectAll('.stroke')
        .data(d.datum.drawings[d.datum.iconIndex].drawing)
        .enter()
        .append('path')
        .classed('stroke', true)
        .style('fill', 'none')
        .style('pointer-events', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 8)
        .attr('d', line);

  }

  chart.switch = function setKey(value) {
    if (!arguments.length) { return positionKey; }
    positionKey = value;
    update();
    return this;
  };

  chart.colorBy = function setColorBy(value) {
    if (!arguments.length) { return showTypes; }
    showTypes = value;
    updateFill();
    return this;
  };

  chart.width = function setWidth(value) {
    if (!arguments.length) { return width; }
    width = value;
    return this;
  };

  chart.height = function setHeight(value) {
    if (!arguments.length) { return height; }
    height = value;
    return this;
  };

  return chart;
}

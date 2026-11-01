import * as d3 from 'd3';
import createDraw from './draw';
import beeswarm from './util/beeswarm';

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

// doodles are stored in a 255x255 coordinate space
const DOODLE_SIZE = 255;

function drawStrokes(panel, strokes) {
  panel.selectAll('.stroke')
    .data(strokes)
    .join('path')
    .attr('class', 'stroke')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 8)
    .attr('pointer-events', 'none')
    .attr('d', line);
}

export default function createSwarm() {
  let width = 780;
  let height = 750;
  const margin = { top: 20, right: 50, bottom: 50, left: 40 };
  const radius = 12;
  const focusRadius = 66;
  const focusIcon = 72;

  let dotsG = null;
  let legendG = null;
  let focusG = null;
  let data = [];
  let showTypes = true;
  let positionKey = 'd_draw_md';
  let focused = null;

  const xScale = d3.scaleLinear();
  const draw = createDraw();

  const chart = function wrapper(selection, drawSelection, rawData) {
    data = rawData.map(d => ({
      ...d,
      key: d.word,
      drawings: d.drawings.map(drawing => ({ drawing })),
      iconIndex: 0,
    }));

    draw.showTitle(false).animate(false).showingSecs(false)(drawSelection);

    const fullWidth = width + margin.left + margin.right;
    const fullHeight = height + margin.top + margin.bottom;
    const svg = d3.select(selection).append('svg')
      .attr('class', 'responsive')
      .attr('width', fullWidth)
      .attr('height', fullHeight)
      .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    dotsG = g.append('g').attr('class', 'dots');

    legendG = g.append('g')
      .attr('class', 'legend')
      .attr('pointer-events', 'none')
      .attr('transform', `translate(${width - 100},0)`);

    // A single, always-on-top layer for the hovered doodle. Only one doodle
    // can ever be enlarged, and it never intercepts pointer events.
    focusG = g.append('g')
      .attr('class', 'focus')
      .attr('pointer-events', 'none')
      .style('display', 'none');

    focusG.append('circle')
      .attr('class', 'focus-background')
      .attr('r', focusRadius)
      .attr('opacity', 0.9);

    focusG.append('g')
      .attr('class', 'panel')
      .attr('transform', `translate(${-focusIcon / 2}, ${-focusIcon / 2 - 12}) scale(${focusIcon / DOODLE_SIZE})`);

    focusG.append('text')
      .attr('class', 'dot-text word')
      .attr('text-anchor', 'middle')
      .attr('y', focusIcon / 2 + 2);

    focusG.append('text')
      .attr('class', 'dot-text value')
      .attr('text-anchor', 'middle')
      .attr('y', focusIcon / 2 + 18);

    update();
  };

  function suffixFor(key) {
    return key === 'scount_me' ? ' strokes' : ' secs';
  }

  function colorFor(type) {
    return showTypes ? typeColors[type] : 'white';
  }

  function updateSwarm() {
    xScale
      .domain(d3.extent(data, d => d[positionKey]))
      .range([0, width]);

    return beeswarm()
      .data(data)
      .distributeOn(d => xScale(d[positionKey]))
      .radius(radius)
      .orientation('horizontal')
      .side('symetric')
      .arrange();
  }

  function createLegend() {
    const keyE = legendG.selectAll('.key')
      .data(Object.keys(typeColors))
      .enter()
      .append('g')
      .attr('class', 'key')
      .attr('transform', (d, i) => `translate(${-margin.top},${(radius + 5) * i})`);

    keyE.append('circle')
      .attr('r', radius / 2)
      .attr('fill', d => colorFor(d))
      .attr('opacity', 0.8);

    keyE.append('text')
      .attr('x', radius + 5)
      .attr('dy', 5)
      .text(d => d.replace('_', ' '));
  }

  function update() {
    hideFocus();
    const swarm = updateSwarm();

    const doodle = dotsG.selectAll('.doodle')
      .data(swarm, d => d.datum.word);

    const doodleE = doodle.enter()
      .append('g')
      .attr('class', 'doodle')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)
      .on('mouseenter', (event, d) => showFocus(d))
      .on('mouseleave', hideFocus)
      .on('click', (event, d) => cycleIcon(event.currentTarget, d));

    doodleE.append('circle')
      .attr('class', 'background')
      .attr('r', radius)
      .attr('fill', 'white')
      .attr('stroke', '#777')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8);

    doodleE.append('g')
      .attr('class', 'panel')
      .attr('transform', `translate(${-radius / 2}, ${-radius / 2}) scale(${radius / DOODLE_SIZE})`)
      .each(function addStrokes(d) {
        drawStrokes(d3.select(this), d.datum.drawings[d.datum.iconIndex].drawing);
      });

    doodle.merge(doodleE)
      .transition()
      .duration(500)
      .attr('transform', d => `translate(${d.x}, ${(height / 2) + d.y})`);

    updateFill();
  }

  function updateFill() {
    dotsG.selectAll('.doodle .background')
      .transition()
      .duration(500)
      .attr('fill', d => colorFor(d.datum.type));

    if (showTypes) {
      createLegend();
    }
  }

  function showFocus(d) {
    focused = d;
    const { datum } = d;

    focusG
      .attr('transform', `translate(${d.x}, ${(height / 2) + d.y})`)
      .style('display', null);

    focusG.select('.focus-background').attr('fill', colorFor(datum.type));
    drawStrokes(focusG.select('.panel'), datum.drawings[datum.iconIndex].drawing);
    focusG.select('.word').text(datum.word);
    focusG.select('.value').text(datum[positionKey] + suffixFor(positionKey));

    draw.drawings([datum]);
  }

  function hideFocus() {
    focused = null;
    if (focusG) {
      focusG.style('display', 'none');
    }
  }

  function cycleIcon(node, d) {
    const { datum } = d;
    datum.iconIndex = (datum.iconIndex + 1) % datum.drawings.length;
    drawStrokes(d3.select(node).select('.panel'), datum.drawings[datum.iconIndex].drawing);
    if (focused === d) {
      showFocus(d);
    }
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

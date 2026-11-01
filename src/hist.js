import * as d3 from 'd3';
import createDraw from './draw';

export default function createHist() {
  const margin = { top: 40, right: 10, bottom: 40, left: 30 };
  let width = 900;
  let height = 400;
  let root = null;
  let g = null;
  let data = {};
  let overlap = true;
  let xDomain = null;
  let histKey = 'hist';
  let drawingsKey = 'drawings';
  let keys = null;
  let showAvg = true;
  let showDrawings = true;

  const xScale = d3.scaleLinear();
  const yScale = d3.scaleLinear();
  const draw = createDraw();

  const chart = function wrapper(selection, drawSelection, rawData) {
    data = rawData;
    root = d3.select(selection);

    if (drawSelection) {
      draw.showTitle(true).animate(false).showingSecs(drawingsKey === 'drawings')(drawSelection);
    } else {
      showDrawings = false;
    }

    if (!keys) {
      ({ keys } = data);
    }
    setupScales();

    if (overlap) {
      setupSvg();
    }

    update();
  };

  function setupScales() {
    const xMaxs = keys.map(id => d3.max(data[id][histKey], d => d.x1));
    const yMaxs = keys.map(id => d3.max(data[id][histKey], d => d.freq));

    if (!xDomain) {
      xDomain = [0, d3.max(xMaxs)];
    }

    xScale
      .rangeRound([0, width])
      .domain(xDomain);

    yScale
      .range([height, 0])
      .domain([0, d3.max(yMaxs)]);
  }

  function setupSvg() {
    const fullWidth = width + margin.left + margin.right;
    const fullHeight = height + margin.top + margin.bottom;
    const svg = root.append('svg')
      .attr('class', 'responsive')
      .attr('width', fullWidth)
      .attr('height', fullHeight)
      .attr('viewBox', `0 0 ${fullWidth} ${fullHeight}`);

    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    const yAxis = d3.axisLeft(yScale)
      .ticks(Math.round(height / 40), '%')
      .tickSizeOuter(0);

    g.append('g')
      .attr('class', 'axis axis--y')
      .call(yAxis);
  }

  function setupAnnotations(aKeys) {
    if (!showAvg) {
      return;
    }

    const means = aKeys.map(k => ({ mean: +data[k].dt_sec_mean, key: k }));

    const avg = g.selectAll('.avg')
      .data(means)
      .enter()
      .append('g')
      .classed('avg', true)
      .attr('pointer-events', 'none');

    avg.append('line')
      .attr('stroke-width', 2.0)
      .attr('stroke', '#424242')
      .attr('opacity', 0.8)
      .attr('x1', d => xScale(d.mean))
      .attr('x2', d => xScale(d.mean))
      .attr('y1', 0)
      .attr('y2', height);

    avg.append('text')
      .attr('x', d => xScale(d.mean))
      .attr('dx', 10)
      .attr('dy', (d, i) => i * 14)
      .attr('y', margin.top / 2)
      .classed('graph-label', true)
      .text(d => `Avg time: ${Math.round(d.mean * 10) / 10} sec`);
  }

  function setupBackground(bKeys) {
    // one invisible hover target per bin, spanning the full chart height
    const x0s = new Set(bKeys.flatMap(id => data[id][histKey].map(d => d.x0)));

    g.selectAll('.background')
      .data([...x0s])
      .enter()
      .append('rect')
      .attr('class', 'background')
      .attr('fill', 'transparent')
      .attr('x', d => xScale(d))
      .attr('y', 0)
      .attr('width', d => xScale(d + 1) - xScale(d))
      .attr('height', height)
      .on('mouseover', (event, d) => {
        highlight(d);
        if (showDrawings) {
          draw.drawings(bKeys.map(k => ({ key: k, drawings: data[k][drawingsKey][d] || [], x: d })));
        }
      })
      .on('mouseout', () => highlight(null))
      .on('click', () => draw.reanimate());
  }

  function update() {
    if (overlap) {
      setupBackground(keys);
    }

    keys.forEach((id) => {
      if (!overlap) {
        setupSvg();
        setupBackground(keys);
      }

      const bar = g.append('g')
        .classed(id, true)
        .selectAll('.bar')
        .data(data[id][histKey], d => id + d.x0)
        .enter()
        .append('g')
        .classed('bar', true)
        .classed(id, true)
        .attr('transform', d => `translate(${xScale(d.x0)},${yScale(d.freq)})`);

      bar.append('rect')
        .attr('x', 1)
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr('height', d => height - yScale(d.freq))
        .attr('pointer-events', 'none');

      if (!overlap) {
        g.append('text')
          .attr('class', 'small-mult-label')
          .attr('x', 0)
          .attr('y', height + (margin.bottom / 2))
          .attr('dy', 10)
          .text(id);

        setupAnnotations([id]);
      }
    });

    if (overlap) {
      setupAnnotations(keys);
    }
  }

  // highlight bars in this chart's container only (not every chart on the page)
  function highlight(x0) {
    root.selectAll('.bar').classed('active', b => b.x0 === x0);
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

  chart.histKey = function setHistKey(value) {
    if (!arguments.length) { return histKey; }
    histKey = value;
    return this;
  };

  chart.keys = function setkeys(value) {
    if (!arguments.length) { return keys; }
    keys = value;
    return this;
  };

  chart.showAvg = function setShowAvg(value) {
    if (!arguments.length) { return showAvg; }
    showAvg = value;
    return this;
  };

  chart.showDrawings = function setShowDrawings(value) {
    if (!arguments.length) { return showDrawings; }
    showDrawings = value;
    return this;
  };

  chart.drawingsKey = function setDrawingsKey(value) {
    if (!arguments.length) { return drawingsKey; }
    drawingsKey = value;
    return this;
  };

  return chart;
}

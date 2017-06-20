
import * as d3 from 'd3';
import createDraw from './draw';

export default function createHist() {
  const margin = { top: 40, right: 10, bottom: 40, left: 30 };
  let width = 900;
  let height = 400;
  let svg = null;
  let g = null;
  let bar = null;
  let data = [];
  let overlap = true;
  let xDomain = null;
  let histKey = 'hist';
  let keys = null;
  // let graphKeys = [];
  let showAvg = true;
  let showDrawings = true;

  const xScale = d3.scaleLinear();
  const yScale = d3.scaleLinear();
  const draw = createDraw();

  const chart = function wrapper(selection, drawSelection, rawData) {
    data = rawData;

    if (drawSelection) {
      draw(drawSelection);
    }

    if (!keys) {
      keys = data.keys;
    }
    setupScales();


    if (overlap) {
      setupSvg(selection, keys);
    }

    update(selection);
  };

  function setupScales() {
    const xMins = [];
    const xMaxs = [];
    const yMins = [];
    const yMaxs = [];
    keys.forEach((id) => {
      xMins.push(d3.min(data[id][histKey], d => d.x1));
      xMaxs.push(d3.max(data[id][histKey], d => d.x1));
      yMins.push(d3.min(data[id][histKey], d => d.freq));
      yMaxs.push(d3.max(data[id][histKey], d => d.freq));
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
    // graphKeys = mKeys
    svg = d3.select(selection).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // TODO: g is global - but dangerous.
    g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(${0},${height})`)
      .call(d3.axisBottom(xScale));

    const tickCount = Math.round(height / 40);

    const yAxis = d3.axisLeft(yScale)
      .ticks(tickCount, '%')
      .tickSizeOuter(0);

    g.append('g')
      .attr('class', 'axis axis--y')
      // .attr('transform', `translate(${0},${height})`)
      .call(yAxis);
  }

  function setupAnnotations(aKeys) {
    if (!showAvg) {
      return;
    }

    const means = aKeys.map((k) => {
      return {
        mean: +data[k].dt_sec_mean,
        key: k,
      };
    });

    const avg = g.selectAll('.avg')
      .data(means)
      .enter()
      .append('g')
      .classed('avg', true);

    avg.append('line')
      .attr('stroke-width', 2.0)
      .attr('stroke', '#424242')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .attr('x1', d => xScale(d.mean))
      .attr('x2', d => xScale(d.mean))
      .attr('y1', margin.top)
      .attr('y1', height);
    avg.append('text')
      .attr('x', d => xScale(d.mean))
      .attr('pointer-events', 'none')
      .attr('dx', 10)
      .attr('dy', (d, i) => i * 14)
      .attr('y', margin.top / 2)
      .classed('graph-label', true)
      .text(d => `Avg time: ${Math.round(d.mean * 10) / 10} sec`);
  }

  function setupBackground(bKeys) {
    let barData = [];
    bKeys.forEach((id) => {
      barData = barData.concat(data[id][histKey]);
    });

    // draw background bars
    const x0s = d3.set(barData, d => d.x0);

    const that = this;

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
      .on('mouseover', (d) => {
        mouseover.bind(that)(d);
        if (showDrawings) {
          // console.log(bKeys)
          const animalDrawings = bKeys.map(k => ({ key: k, drawings: data[k].drawings[d] || [], x: d }));
          console.log(animalDrawings)
          draw.drawings(animalDrawings);
        }
      })
      .on('mouseout', mouseout.bind(this));
  }

  function update(selection) {
    // overlap gets background bars here.
    if (overlap) {
      setupBackground(keys);
    }

    // loop through all keys
    keys.forEach((id) => {
      if (!overlap) {
        setupSvg(selection, [id]);
        setupBackground([id]);
      }

      const idG = g.append('g')
        .classed(id, true);

      bar = idG.selectAll('.bar')
        .data(data[id][histKey], d => id + d.x0)
        .enter().append('g')
        .classed('bar', true)
        .classed(id, true)
        .attr('transform', d => `translate(${xScale(d.x0)},${yScale(d.freq)})`);

      bar
        .append('rect')
        .attr('x', 1)
        // .attr('opacity', overlap ? 0.6 : 1.0)
        .attr('width', d => xScale(d.x1) - xScale(d.x0))
        .attr('height', d => height - yScale(d.freq))
        .attr('pointer-events', 'none');

      if (!overlap) {
        g.append('text')
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

  return chart;
}

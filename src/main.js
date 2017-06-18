import * as d3 from 'd3';

import createDraw from './draw';
import createHist from './hist';

import '../index.html';
import './style';

const draw = createDraw();
const limitDraw = createDraw().limit(14);
const hist = createHist();

function display(error, dogs, cats, data) {
  console.log(error);
  draw('#dogs', dogs);
  limitDraw('#dogs-title', dogs);
  limitDraw('#cats', cats);
  hist('#hist', data);
}

d3.queue()
  .defer(d3.json, 'data/dogs.json')
  .defer(d3.json, 'data/cats.json')
  .defer(d3.json, 'data/data.json')
  .await(display);

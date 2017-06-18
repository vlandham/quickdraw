import * as d3 from 'd3';

import createDraw from './draw';
import createHist from './hist';

import '../index.html';
import './style';

const draw = createDraw();
// const limitDraw = createDraw().limit(14);
const hist = createHist();

function display(error, dogs, cats, dogCat, birds) {
  console.log(error);
  draw.limit(null)('#dogs', dogs);
  draw.limit(14)('#dogs-title', dogs);
  draw.limit(14)('#cats', cats);
  hist.xDomain([0, 24])('#hist', dogCat);
  hist
    .xDomain([0, 18])
    .width(200)
    .height(200).overlap(false)('#birds', birds);
}

d3.queue()
  .defer(d3.json, 'data/dogs.json')
  .defer(d3.json, 'data/cats.json')
  .defer(d3.json, 'data/dog_cat_out.json')
  .defer(d3.json, 'data/circle_bird_swan_flamingo_out.json')
  .await(display);

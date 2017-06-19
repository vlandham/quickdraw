import * as d3 from 'd3';

import createDraw from './draw';
import createHist from './hist';

import '../index.html';
import './style';

const draw = createDraw();
// const limitDraw = createDraw().limit(14);
const hist = createHist();

function pullOutDogs(dogCat) {
  const dogDrawings = d3.keys(dogCat.dog.drawings)
    .map((key) => {
      const dr = dogCat.dog.drawings[key][0];
      dr.time = key;
      return dr;
    });

  return dogDrawings;
}

function display(error, dogCat, birds, bugs, shapes) {
  console.log(error);

  // console.log(dogCat.dog.dt_sec_quans)

  const dogDrawings = pullOutDogs(dogCat);
  draw.limit(14)('#dogs-title', dogDrawings);
  // console.log(dogDrawings)

  // draw.limit(null)('#dogs', dogs);
  // draw.limit(14)('#cats', cats);
  // dog-cat histogram
  createHist().xDomain([0, 24]).keys(['dog'])('#dog-hist', dogCat);
  createHist().xDomain([0, 24]).keys(['dog', 'cat'])('#dogcat-hist', dogCat);
  createHist().xDomain([0, 24]).keys(['dog', 'cat', 'horse'])('#dogcathorse-hist', dogCat);

  createHist()
    .histKey('hist_stroke')
    .xDomain([0, 24])
    .showAvg(false)
    .keys(['dog', 'cat', 'horse'])('#dogcathorse-strokes', dogCat);

  createHist()
    .histKey('hist_stroke')
    .xDomain([0, 24])
    .width(260)
    .height(200)
    .showAvg(false)
    .overlap(false)
    .keys(['dog', 'cat', 'horse'])('#dogcathorse-strokes-small', dogCat);

  // bird histogram
  createHist()
    .histKey('hist')
    .showAvg(true)
    .xDomain([0, 20])
    .width(200)
    .height(200)
    .keys(null)
    .overlap(false)('#birds', birds);

  createHist()
    .xDomain([0, 20])
    .width(200)
    .height(200)
    .keys(null)
    .overlap(false)('#bugs', bugs);

  createHist()
    .xDomain([0, 20])
    .width(200)
    .height(200)
    .keys(null)
    .overlap(false)('#shapes', shapes);

}

d3.queue()
  .defer(d3.json, 'data/dog_cat_horse_out.json')
  .defer(d3.json, 'data/circle_bird_swan_flamingo_out.json')
  .defer(d3.json, 'data/ant_mosquito_butterfly_scorpion_out.json')
  .defer(d3.json, 'data/circle_triangle_square_squiggle_out.json')
  .await(display);

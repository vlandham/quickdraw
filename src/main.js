import * as d3 from 'd3';

import createDraw from './draw';
import createHist from './hist';
import createSwarm from './swarm';

import '../css/normalize.css';
import '../css/skeleton.css';
import '../css/style.css';

function pullOutDogs(dogCat) {
  const dogDrawings = Object.entries(dogCat.dog.drawings)
    .map(([time, drawings]) => ({ ...drawings[0], time }));
  return [{ key: 'dog', drawings: dogDrawings }];
}

function displayAnimals(dogCat) {
  const titleDogs = createDraw().limit(14).showTitle(false).animate(true);
  titleDogs('#dogs-title');
  titleDogs.drawings(pullOutDogs(dogCat));

  createHist().xDomain([0, 20]).keys(['dog'])('#dog-hist', '#dog-draw', dogCat);
  createHist().xDomain([0, 20]).keys(['dog', 'cat'])('#dogcat-hist', '#dogcat-draw', dogCat);
  createHist().xDomain([0, 20]).keys(['dog', 'cat', 'horse'])('#dogcathorse-hist', '#dogcathorse-draw', dogCat);

  createHist()
    .histKey('hist_stroke')
    .xDomain([0, 24])
    .showAvg(false)
    .drawingsKey('drawings_strokes')
    .keys(['dog', 'cat', 'horse'])('#dogcathorse-strokes', '#dogcathorse-strokes-draw', dogCat);

  createHist()
    .histKey('hist_stroke')
    .xDomain([0, 24])
    .width(260)
    .height(200)
    .showAvg(false)
    .overlap(false)
    .drawingsKey('drawings_strokes')
    .keys(['dog', 'cat', 'horse'])('#dogcathorse-strokes-small', '#dogcathorse-strokes-draw', dogCat);
}

function displaySmallMults([birds, bugs, shapes]) {
  const smallMult = () => createHist()
    .xDomain([0, 20])
    .width(200)
    .height(200)
    .overlap(false);

  smallMult()('#birds', '#birds-draw', birds);
  smallMult()('#bugs', '#bugs-draw', bugs);
  smallMult()('#shapes', '#shapes-draw', shapes);
}

function displaySwarm(stats) {
  const swarm = createSwarm();
  swarm('#swarm', '#swarm-draw', stats);

  d3.select('#swarm-select').on('change', (event) => {
    swarm.switch(event.target.value);
  });
}

const logError = (err) => console.error(err); // eslint-disable-line no-console

d3.json('data/dog_cat_horse_out.json').then(displayAnimals).catch(logError);

Promise.all([
  d3.json('data/bird_flamingo_owl_duck_out.json'),
  d3.json('data/ant_mosquito_butterfly_scorpion_out.json'),
  d3.json('data/circle_squiggle_triangle_square_out.json'),
]).then(displaySmallMults).catch(logError);

d3.json('data/all_aggregates_with_doodles.json').then(displaySwarm).catch(logError);

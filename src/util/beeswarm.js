/* eslint no-use-before-define: ["error", { "functions": false }]*/

import SortedDirectAccessDoublyLinkedList from './sortedDirectAccessDoublyLinkedList';

export default function () {
  let data = [];                  // original data to arrange
  let radius = 4;                 // default radius
  let orientation = 'horizontal'; // default orientation; 'vertical' also available
  let side = 'symetric';          // default side; 'positive' and 'negative' are also available
  let distributeOn =              // accessor to the x value
          function d(datum) {
            return datum.x;
          };

  let minDistanceBetweenCircles;
  let minSquareDistanceBetweenCircles;
  let xBasedDataManager;          // for collision detection, x-based sorted direct-access doubly-linked list of data, used to find nearest already arranged data
  let xBasedColliderManager;      // for collision detection, x-based sorted direct-access doubly-linked list of already arranged data, limit collision detection to already arranged neighbours
  let yBasedColliderManager;      // for collision detection, y-based sorted direct-access doubly-linked list of already arranged data, limit collision detection to already arranged neighbours
  let arrangement;                // result, array of {datum: , x: , y: }

  let maxOverlap = 1000;

  // --> for metrics purpose
  let totalPossibleColliders;
  let maxPossibleColliders;
  let totalTestedPlacements;
  let visitedColliderCount;
  let totalVisitedColliders;
  let maxVisitedColliders;
  // <-- for metrics purpose

  function _beeswarm() {}

  _beeswarm.data = function setData(_) {
    if (!arguments.length) { return data; }
    data = _;

    return _beeswarm;
  };

  _beeswarm.radius = function setRadius(_) {
    if (!arguments.length) { return radius; }
    radius = _;

    return _beeswarm;
  };

  _beeswarm.orientation = function setOrientation(_) {
    if (!arguments.length) { return orientation; }
    if (_ === 'horizontal' ||
        _ === 'vertical'
       ) {
      orientation = _;
    }

    return _beeswarm;
  };

  _beeswarm.side = function setSide(_) {
    if (!arguments.length) { return side; }
    if (_ === 'symetric' ||
        _ === 'positive' ||
        _ === 'negative'
       ) {
      side = _;
    }

    return _beeswarm;
  };

  _beeswarm.distributeOn = function setDistributeOn(_) {
    if (!arguments.length) { return distributeOn; }
    distributeOn = _;

    return _beeswarm;
  };

  _beeswarm.arrange = function arrange() {
    initArrangement();
    let i = 0;
    const length = arrangement.length;

    // keep track of the limits of the y positions assigned
    // in case we bail out early and can use it to approximate the swarm
    let maxYPosition = 0;

    for (i = 0; i < length; i++) {
      const d = arrangement[i];
      let bestYPosition = -Infinity;
      let relativeYPos;
      const xBasedPossibleColliders = gatherXBasedPossibleColliders(d);
      if (xBasedPossibleColliders.length === 0) {
        bestYPosition = 0;
      } else if (xBasedPossibleColliders.length > maxOverlap) {
        // if there are too many colliders, exit out.
        // assign a random position within the range of used y positions
        bestYPosition = 2 * (Math.random() - 0.5) * maxYPosition;
      } else {
        yBasedColliderManager.empty();

        yBasedColliderManager.addMany(xBasedPossibleColliders);
        // try to place on the x-axis
        d.free = 0;
        if (!collidesWithOther(d, yBasedColliderManager.closestTo0())) {
          bestYPosition = 0;
          // -->for metrics purpose
          totalVisitedColliders += visitedColliderCount;
          if (visitedColliderCount > maxVisitedColliders) {
            maxVisitedColliders = visitedColliderCount;
          }
          visitedColliderCount = 0;
          totalTestedPlacements += 1;
          // <--for metrics purpose
        } else {
          xBasedPossibleColliders.forEach(function (xbpc) {
            // try to place below and above an already arranged datum
            relativeYPos = yPosRelativeToXbpc(xbpc, d);
            placeBelow(d, xbpc, relativeYPos);
            if (isAuthorizedPlacement(d) &&
                isBetterPlacement(d, bestYPosition) &&
                !collidesWithOther(d, yBasedColliderManager.dln(xbpc))) {
              bestYPosition = d.free;
            }
            // -->for metrics purpose
            totalVisitedColliders += visitedColliderCount;
            if (visitedColliderCount > maxVisitedColliders) {
              maxVisitedColliders = visitedColliderCount;
            }
            visitedColliderCount = 0;
            totalTestedPlacements += 1;
            // <--for metrics purpose
            placeAbove(d, xbpc, relativeYPos);
            if (isAuthorizedPlacement(d) &&
                isBetterPlacement(d, bestYPosition) &&
                !collidesWithOther(d, yBasedColliderManager.dln(xbpc))) {
              bestYPosition = d.free;
            }
            // -->for metrics purpose
            totalVisitedColliders += visitedColliderCount;
            if (visitedColliderCount > maxVisitedColliders) {
              maxVisitedColliders = visitedColliderCount;
            }
            visitedColliderCount = 0;
            totalTestedPlacements += 1;
            // <--for metrics purpose
          });
        }
      }
      d.free = bestYPosition;
      if (orientation === 'horizontal') {
        d.x = d.fixed;
        d.y = bestYPosition;
      } else {
        d.x = bestYPosition;
        d.y = d.fixed;
      }
      xBasedColliderManager.add(d);

      // track the max y position in case we bail out early. This lets us
      // distribute the remaining points randomly throughout the range of
      // used up positions
      if (maxYPosition < bestYPosition) {
        maxYPosition = bestYPosition;
      }
    }

    return arrangement;
  };

  _beeswarm.metrics = function metrics() {
    return {
      totalPossibleColliders,
      maxPossibleColliders,
      totalTestedPlacements,
      visitedColliderCount,
      totalVisitedColliders,
      maxVisitedColliders,
    };
  };


  function initArrangement() {
    arrangement = data.map(function ar(d,i) {
      return {
        datum: d,
        id: i,
        fixed: distributeOn(d),
        free: -Infinity,
      };
    });

    minDistanceBetweenCircles = 2 * radius;
    minSquareDistanceBetweenCircles = Math.pow(minDistanceBetweenCircles, 2);
    xBasedDataManager = new SortedDirectAccessDoublyLinkedList()
      .valueAccessor((d) => d.fixed)
      .addMany(arrangement);
    xBasedColliderManager = new SortedDirectAccessDoublyLinkedList()
      .valueAccessor((d) => d.fixed);
    yBasedColliderManager = new SortedDirectAccessDoublyLinkedList()
      .valueAccessor((d) => d.free);

    // -->for metrics purpose
    totalPossibleColliders = maxPossibleColliders = 0;
    totalTestedPlacements = 0;
    visitedColliderCount = totalVisitedColliders = maxVisitedColliders = 0;
    // <--for metrics purpose
  }

  function findNearestPossibleCollider(dln, visitedDln, direction) {
    if (visitedDln === null) { // special case: max reached
      return null;
    } else if ((direction === 'prev') ?
               dln.value - visitedDln.value > minDistanceBetweenCircles :
               visitedDln.value - dln.value > minDistanceBetweenCircles
              ) {
      // stop visit, remaining data are too far away
      return null;
    } else { // visitedDln is close enought
      if (isFinite(visitedDln.datum.free)) { // visitedDln is already arranged, and hence is the nearest possible x-based collider
        return (visitedDln.datum);
      }
      // continue finding
      return findNearestPossibleCollider(dln, visitedDln[direction], direction);
    }
  }

  function visitToGatherXBasedPossibleColliders(dln, visitedDln, direction, xBasedPossibleColliders) {
    if (visitedDln === null) { // special case: extreme reached
      return;
    } else if ((direction === 'prev') ?
               dln.value - visitedDln.value > minDistanceBetweenCircles :
               visitedDln.value - dln.value > minDistanceBetweenCircles
              ) {
      // stop visit, remaining data are too far away
      return;
    } else { // visitedDln is close enought
      // visitedDln is already arranged, and hence is a possible x-based collider
      xBasedPossibleColliders.push(visitedDln.datum);
      // continue gathering
      visitToGatherXBasedPossibleColliders(dln, visitedDln[direction], direction, xBasedPossibleColliders);
    }
  }

  function gatherXBasedPossibleColliders(datum) {
    const xBasedPossibleColliders = [];
    let dln = xBasedDataManager.dln(datum);
    // use xBasedDataManager to retrieve nearest already arranged data
    const nearestXPrevAlreadyArrangedData = findNearestPossibleCollider(dln, dln.prev, 'prev');
    const nearestXNextAlreadyArrangedData = findNearestPossibleCollider(dln, dln.next, 'next');

    // use xBasedColliderManager to retrieve already arranged data that may collide with datum (ie, close enought to datum considering x position)
    if (nearestXPrevAlreadyArrangedData != null) {
      // visit x-prev already arranged nodes
      dln = xBasedColliderManager.dln(nearestXPrevAlreadyArrangedData);
      visitToGatherXBasedPossibleColliders(dln, dln, 'prev', xBasedPossibleColliders);
    }

    if (nearestXNextAlreadyArrangedData != null) {
      // visit x-next already arranged nodes
      dln = xBasedColliderManager.dln(nearestXNextAlreadyArrangedData);
      visitToGatherXBasedPossibleColliders(dln, dln, 'next', xBasedPossibleColliders);
    }

    // -->for metrics purpose
    totalPossibleColliders += xBasedPossibleColliders.length;
    if (xBasedPossibleColliders.length > maxPossibleColliders) {
      maxPossibleColliders = xBasedPossibleColliders.length;
    }
    // <--for metrics purpose
    return xBasedPossibleColliders;
  }

  function isAuthorizedPlacement(datum) {
    if (side === 'symetric') {
      return true;
    } else if (side === 'positive') {
      return datum.free >= 0;
    } else {
      return datum.free <= 0;
    }
  }

  function isBetterPlacement(datum, bestYPosition) {
    return Math.abs(datum.free) < Math.abs(bestYPosition);
  }

  function yPosRelativeToXbpc(xbpc, d) {
    // handle Float approximation with +1E-6
    return Math.sqrt(minSquareDistanceBetweenCircles - Math.pow(d.fixed - xbpc.fixed, 2)) + 1E-6;
  }

  function placeBelow(d, aad, relativeYPos) {
    d.free = aad.free - relativeYPos;
  }

  function placeAbove(d, aad, relativeYPos) {
    d.free = aad.free + relativeYPos;
  }

  function areCirclesColliding(d0, d1) {
    visitedColliderCount++; // for metrics prupose

    return (Math.pow(d1.free - d0.free, 2) + Math.pow(d1.fixed - d0.fixed, 2)) < minSquareDistanceBetweenCircles;
  }

  function visitToDetectCollisionWithOther(datum, visitedDln, direction, visitCount) {
    if (visitedDln === null) { // special case: y_max reached, no collision detected
      return false;
    } else if ((direction === 'prev') ?
               datum.free - visitedDln.datum.free > minDistanceBetweenCircles :
               visitedDln.datum.free - datum.free > minDistanceBetweenCircles
              ) {
      // stop visit, no collision detected, remaining data are too far away
      return false;
    } else if (areCirclesColliding(datum, visitedDln.datum)) {
      return true;
    } else {
      // continue visit
      return visitToDetectCollisionWithOther(datum, visitedDln[direction], direction, visitCount++);
    }
  }

  function collidesWithOther(datum, visitedDln) {
    let visitCount = 0;
    // visit prev dlns for collision check
    // if (visitToDetectCollisionWithOther(datum, visitedDln.prev, 'prev', visitCount++)) {
    if (visitToDetectCollisionWithOther(datum, visitedDln, 'prev', visitCount++)) {
      return true;
    } else {
      // visit next dlns for collision check
      //  return visitToDetectCollisionWithOther(datum, visitedDln.next, 'next', visitCount++);
      return visitToDetectCollisionWithOther(datum, visitedDln, 'next', visitCount++);
    }
  }

  return _beeswarm;
}

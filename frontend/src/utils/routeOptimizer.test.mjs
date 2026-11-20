import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { findBestOrder, orderCost } from './routeOptimizer.js';

function makeMatrix(size) {
  const matrix = [];
  for (let row = 0; row < size; row += 1) {
    matrix[row] = [];
    for (let column = 0; column < size; column += 1) {
      matrix[row][column] = row === column ? 0 : Math.floor(Math.random() * 100) + 1;
    }
  }
  return matrix;
}

function bruteForce(matrix, stopCount) {
  const used = new Array(stopCount).fill(false);
  let bestOrder = null;
  let bestCost = Infinity;
  const original = [0];
  for (let index = 1; index <= stopCount; index += 1) {
    original.push(index);
  }
  original.push(stopCount + 1);
  bestCost = orderCost(matrix, original);
  bestOrder = Number.isFinite(bestCost) ? original : null;

  function search(order, cost) {
    if (order.length === stopCount + 1) {
      const complete = [...order, stopCount + 1];
      const completeCost = orderCost(matrix, complete);
      if (Number.isFinite(completeCost) && completeCost < bestCost) {
        bestCost = completeCost;
        bestOrder = complete;
      }
      return;
    }

    for (let stop = 1; stop <= stopCount; stop += 1) {
      if (used[stop - 1]) continue;
      const nextCost = matrix[order[order.length - 1]][stop];
      if (!Number.isFinite(nextCost)) continue;
      used[stop - 1] = true;
      order.push(stop);
      search(order, cost + nextCost);
      order.pop();
      used[stop - 1] = false;
    }
  }

  if (bestOrder) search([0], 0);
  return bestOrder;
}

for (let trip = 0; trip < 300; trip += 1) {
  const stopCount = (trip % 7) + 1;
  const matrix = makeMatrix(stopCount + 2);
  const result = findBestOrder(matrix, stopCount);
  const expected = bruteForce(matrix, stopCount);
  assert.deepEqual(result, expected);
  assert.equal(orderCost(matrix, result), orderCost(matrix, expected));
}

const unreachableMatrix = [
  [0, 1, Infinity],
  [1, 0, Infinity],
  [Infinity, Infinity, 0],
];
assert.equal(findBestOrder(unreachableMatrix, 1), null);

const tenStopMatrix = makeMatrix(12);
const startTime = performance.now();
const tenStopResult = findBestOrder(tenStopMatrix, 10);
const elapsed = performance.now() - startTime;
assert.ok(tenStopResult);
assert.ok(elapsed < 1000, `10 stops took ${elapsed.toFixed(2)} ms`);

console.log('PASS route optimizer: 300 random trips, unreachable stop, 10-stop speed');

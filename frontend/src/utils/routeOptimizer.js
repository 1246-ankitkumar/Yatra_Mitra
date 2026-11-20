// Find the cost of one complete route order.
export function orderCost(matrix, order) {
  if (!Array.isArray(matrix) || !Array.isArray(order) || order.length < 2) {
    return Infinity;
  }

  let total = 0;

  for (let index = 0; index < order.length - 1; index += 1) {
    const from = order[index];
    const to = order[index + 1];
    const row = matrix[from];
    const cost = row ? row[to] : undefined;

    if (!Number.isFinite(cost)) {
      return Infinity;
    }

    total += cost;
  }

  return total;
}

// Find the best stop order. Start and final destination stay in place.
export function findBestOrder(matrix, stopCount) {
  if (!Array.isArray(matrix) || !Number.isInteger(stopCount) || stopCount < 0) {
    return null;
  }

  const finalIndex = stopCount + 1;
  const originalOrder = [0];
  for (let index = 1; index <= stopCount; index += 1) {
    originalOrder.push(index);
  }
  originalOrder.push(finalIndex);

  const originalCost = orderCost(matrix, originalOrder);
  if (!Number.isFinite(originalCost)) {
    return null;
  }

  if (stopCount === 0) {
    return originalOrder;
  }

  // Use a simple nearest-neighbour guess for large trips.
  if (stopCount > 10) {
    const guess = [0];
    const remaining = [];
    for (let index = 1; index <= stopCount; index += 1) {
      remaining.push(index);
    }

    let current = 0;
    while (remaining.length > 0) {
      let nextPosition = -1;
      let lowestCost = Infinity;

      for (let position = 0; position < remaining.length; position += 1) {
        const stopIndex = remaining[position];
        const cost = matrix[current]?.[stopIndex];
        if (Number.isFinite(cost) && cost < lowestCost) {
          lowestCost = cost;
          nextPosition = position;
        }
      }

      if (nextPosition === -1) {
        return null;
      }

      const nextIndex = remaining[nextPosition];
      guess.push(nextIndex);
      remaining.splice(nextPosition, 1);
      current = nextIndex;
    }

    const finalCost = matrix[current]?.[finalIndex];
    if (!Number.isFinite(finalCost)) {
      return null;
    }
    guess.push(finalIndex);

    if (orderCost(matrix, guess) < originalCost) {
      return guess;
    }
    return originalOrder;
  }

  // Try every order for 10 stops or fewer.
  let bestOrder = originalOrder;
  let bestCost = originalCost;
  const stops = [];
  const used = new Array(stopCount + 1).fill(false);

  for (let index = 1; index <= stopCount; index += 1) {
    stops.push(index);
  }

  function search(order, partialCost) {
    if (partialCost >= bestCost) {
      return;
    }

    if (order.length === stopCount + 1) {
      const completeOrder = [...order, finalIndex];
      const completeCost = orderCost(matrix, completeOrder);
      if (Number.isFinite(completeCost) && completeCost < bestCost) {
        bestCost = completeCost;
        bestOrder = completeOrder;
      }
      return;
    }

    for (const stopIndex of stops) {
      if (used[stopIndex]) {
        continue;
      }

      const fromIndex = order[order.length - 1];
      const nextCost = matrix[fromIndex]?.[stopIndex];
      if (!Number.isFinite(nextCost)) {
        continue;
      }

      used[stopIndex] = true;
      order.push(stopIndex);
      search(order, partialCost + nextCost);
      order.pop();
      used[stopIndex] = false;
    }
  }

  search([0], 0);
  return bestOrder;
}

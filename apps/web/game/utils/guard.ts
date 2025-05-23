export function exhaustiveGuard(_value: never) {
  throw new Error(`Error! Reached forbidden guard function with unexpected value: ${JSON.stringify(_value)}`);
}

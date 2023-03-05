import { search } from "boardGameAtlas.js";

async function searchExact(name: string) {
  let results = await search({ name: name, fuzzy_match: false, exact: true });
}

async function searchFuzzy(name: string) {
  let results = await search({ name: name, fuzzy_match: false, exact: true });
}

async function main() {}

await main();

//await searchExact("Food Chain Magnate");
// const props = new Map<string, number>();
// for (let i = 0; i <= 300; i++) {
//   const game = await searchRandom();
//   console.log(`${game.name} - ${JSON.stringify(game.developers)}`);
//   Object.keys(game).forEach((key) => {
//     let count = props.get(key) || 0;
//     props.set(key, count + 1);
//   });
// }

// props.forEach((count, key) => {
//   if (count < 30) {
//     console.log(`${key} - ${300 - count} misses`);
//   }
// });

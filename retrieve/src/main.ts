import prompts from "prompts";

import { pairings } from "pairings/pairings.js";
import { retrieve } from "retrieve/retrieve.js";
import { tournament } from "tournament/tournament.js";

const programs: prompts.Choice[] = [
  {
    title: "Pairings",
    value: pairings,
    description: "Generate initial pairings",
  },
  {
    title: "Tournament",
    value: tournament,
    description: "Enter tournament records",
  },
  {
    title: "Retrieve",
    value: retrieve,
    description: "Retrieve board game info from Board Game Atlas",
  },
];

async function main() {
  const selection = await prompts({
    type: "select",
    name: "program",
    message: "Main Menu",
    choices: programs,
  });

  await selection.program();
}

await main();
console.log("Exiting");

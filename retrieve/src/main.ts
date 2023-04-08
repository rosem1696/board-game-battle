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
  let cancelled = false;
  const selection = await prompts(
    {
      type: "select",
      name: "program",
      message: "Main Menu",
      choices: programs,
    },
    {
      onCancel: () => {
        cancelled = true;
      },
    }
  );

  if (cancelled) return;

  try {
    await selection.program();
  } catch (e) {
    console.error(e);
  }
}

await main();
console.log("Exiting");

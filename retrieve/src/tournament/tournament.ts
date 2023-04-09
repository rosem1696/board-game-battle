import { GameID } from "boardGameAtlas.js";
import { readFileJSON, writeFileJSON } from "fileHelp.js";
import {
  GameIDName,
  loadBasePairings,
  loadLoserPairings,
  loadWinnerPairings,
  Pairing,
} from "pairings/pairings.js";
import prompts, { PromptObject } from "prompts";

// Change this after everyone arrives
const numVoters = 8;

export const openingResultsFile = "./resources/openingResults.json";
export const winnerResultsFile = "./resources/winnerResults.json";
export const loserResultsFile = "./resources/loserResults.json";

export interface GameResult extends GameIDName {
  votes?: number;
  votedByWill?: boolean;
  numVoters?: number;
}

export interface VoteResult {
  game1: GameResult;
  game2: GameResult;
}

export interface OpeningResults {
  results: VoteResult[];
}

export interface BracketResults {
  round1?: VoteResult[];
  round2?: VoteResult[];
  round3?: VoteResult[];
  quarterFinal?: VoteResult[];
  semiFinal?: VoteResult[];
  final?: VoteResult[];
}

export interface OpeningResults {
  results: VoteResult[];
}

const onCancel = {
  onCancel: () => {
    throw new Error("User cancelled entry, cannot continue");
  },
};

const programs: prompts.Choice[] = [
  {
    title: "Opening Round",
    value: enterOpeningResults,
    description: "Enter results of the initial pairings",
  },
  {
    title: "Winner Bracket",
    value: enterWinnerResults,
    description: "Enter results for the next round of the winner bracket",
  },
  {
    title: "Loser Bracket",
    value: enterLoserResults,
    description: "Enter results for the next round of the winner bracket",
  },
];

export async function tournament() {
  let cancelled = false;
  const selection = await prompts(
    {
      type: "select",
      name: "round",
      message: "Select Tournament Round",
      choices: programs,
    },
    {
      onCancel: () => {
        cancelled = true;
      },
    }
  );
  if (cancelled) return;
  await selection.round();
}

async function enterOpeningResults() {
  const res = await loadBasePairings();
  if (res === undefined) {
    throw new Error("Base pairings file does not exist");
  }
  const pairings: OpeningResults = { results: res };
  for (const pair of pairings.results) {
    await GetPairingResult(pair);
    printResult(pair);
  }
  writeFileJSON(openingResultsFile, pairings);
}

async function enterWinnerResults() {
  let results = await loadWinnerResults();
  let pairings = await setupNextRoundPairings(results, false);
  for (const pair of pairings) {
    if (pair.game2.id === "") {
      // Bye round in winner bracket gets a perfect score :)
      pair.game1.votedByWill = true;
      pair.game1.votes = numVoters;
      pair.game1.numVoters = numVoters;

      pair.game2.votedByWill = false;
      pair.game2.votes = 0;
      pair.game2.numVoters = numVoters;
    } else {
      await GetPairingResult(pair);
    }
    printResult(pair, false);
  }
  writeFileJSON(winnerResultsFile, results);
}

async function enterLoserResults() {
  let results = await loadLoserResults();
  let pairings = await setupNextRoundPairings(results, true);
  for (const pair of pairings) {
    if (pair.game2.id === "") {
      // Bye round in loser bracket means it gets no votes :(
      pair.game1.votedByWill = false;
      pair.game1.votes = 0;
      pair.game1.numVoters = numVoters;

      pair.game2.votedByWill = true;
      pair.game2.votes = numVoters;
      pair.game2.numVoters = numVoters;
    } else {
      await GetPairingResult(pair);
    }
    printResult(pair, true);
  }
  writeFileJSON(loserResultsFile, results);
}

function pairingFromGames(game1: GameIDName, game2: GameIDName): Pairing {
  return {
    game1: {
      name: game1.name,
      id: game1.id,
    },
    game2: {
      name: game2.name,
      id: game2.name,
    },
  };
}

async function setupNextRoundPairings(
  results: BracketResults,
  inLoserBracket: boolean = false
) {
  if (!results.round1) {
    const startPairings = inLoserBracket
      ? await loadLoserPairings()
      : await loadWinnerPairings();
    if (startPairings === undefined) {
      throw new Error(
        `${inLoserBracket ? "Loser" : "Winner"} pairings file does not exist`
      );
    }
    results.round1 = startPairings;
    console.log("\nEnter votes for Round 1");
    return results.round1;
  }

  if (!results.round2) {
    // 0 and 11 are bye
    results.round2 = [];
    let i = 0;

    while (i < 22) {
      if (i === 0 || i === 11) {
        // Handle bye rounds
        let game1 = getVictor(results.round1[i], inLoserBracket);
        if (!game1)
          throw new Error("Game undefined, something went very wrong");
        results.round2.push(pairingFromGames(game1, { name: "", id: "" }));
        i++;
      } else {
        let game1 = getVictor(results.round1[i], inLoserBracket);
        let game2 = getVictor(results.round1[i + 1], inLoserBracket);
        if (!game1 || !game2)
          throw new Error("Game undefined, something went very wrong");
        results.round2.push(pairingFromGames(game1, game2));
        i += 2;
      }
    }
    console.log("\nEnter votes for Round 2");
    return results.round2;
  }

  if (!results.round3) {
    // 2, 3, 8 and 9 are bye
    results.round3 = [];
    let i = 0;

    while (i < 12) {
      if ([2, 3, 8, 9].includes(i)) {
        // Handle bye rounds
        let game1 = getVictor(results.round2[i], inLoserBracket);
        if (!game1)
          throw new Error("Game undefined, something went very wrong");
        results.round3.push(pairingFromGames(game1, { name: "", id: "" }));
        i++;
      } else {
        let game1 = getVictor(results.round2[i], inLoserBracket);
        let game2 = getVictor(results.round2[i + 1], inLoserBracket);
        if (!game1 || !game2)
          throw new Error("Game undefined, something went very wrong");
        results.round3.push(pairingFromGames(game1, game2));
        i += 2;
      }
    }
    console.log("\nEnter votes for Round 3");
    return results.round3;
  }

  if (!results.quarterFinal) {
    results.quarterFinal = [];
    let i = 0;
    while (i < 8) {
      let game1 = getVictor(results.round3[i], inLoserBracket);
      let game2 = getVictor(results.round3[i + 1], inLoserBracket);
      if (!game1 || !game2)
        throw new Error("Game undefined, something went very wrong");
      results.quarterFinal.push(pairingFromGames(game1, game2));
      i += 2;
    }

    console.log("\nEnter votes for the Quarter Final");
    return results.quarterFinal;
  }

  if (!results.semiFinal) {
    results.semiFinal = [];
    let i = 0;
    while (i < 4) {
      let game1 = getVictor(results.quarterFinal[i], inLoserBracket);
      let game2 = getVictor(results.quarterFinal[i + 1], inLoserBracket);
      if (!game1 || !game2)
        throw new Error("Game undefined, something went very wrong");
      results.semiFinal.push(pairingFromGames(game1, game2));
      i += 2;
    }

    console.log("\nEnter votes for the Semi Final");
    return results.semiFinal;
  }

  if (!results.final) {
    results.final = [];
    let game1 = getVictor(results.semiFinal[0], inLoserBracket);
    let game2 = getVictor(results.semiFinal[1], inLoserBracket);
    if (!game1 || !game2)
      throw new Error("Game undefined, something went very wrong");
    results.final.push(pairingFromGames(game1, game2));

    console.log("\nEnter votes for THE FINAL");
    return results.final;
  }

  throw new Error("All data already entered");
}

/**
 * TODO handle loser round case
 * @param result
 */
function printResult(result: VoteResult, inLoserBracket: boolean = false) {
  const winner = getVictor(result, inLoserBracket);
  const loser = winner.id === result.game1.id ? result.game2 : result.game1;
  if (result.game2.id === "") {
    console.log(`\n\nBye Round: ${winner.name} advances automatically`);
  } else if (inLoserBracket) {
    console.log(`\n\n${loser.name} beats ${winner.name}`);
    console.log(`${loser.votes} to ${winner.votes}`);
    if (winner.votes === loser.votes) {
      console.log("Tie broken by Will");
    }
    console.log(`${winner.name} advances in loser bracket\n`);
  } else {
    console.log(`\n\n${winner.name} beats ${loser.name}`);
    console.log(`${winner.votes} to ${loser.votes}`);
    if (winner.votes === loser.votes) {
      console.log("Tie broken by Will");
    }
    console.log(`${winner.name} advances in winner bracket\n`);
  }
}

export function getVictor(result: VoteResult, inLoserBracket: boolean = false) {
  if (inLoserBracket) {
    return getLoser(result);
  } else {
    return getWinner(result);
  }
}

export function getLoser(result: VoteResult) {
  return getWinner(result).id === result.game1.id ? result.game2 : result.game1;
}

export function getWinner(result: VoteResult) {
  if (
    result.game1.votes === undefined ||
    result.game1.votedByWill === undefined ||
    result.game2.votes === undefined ||
    result.game2.votedByWill === undefined
  ) {
    throw new Error(
      "Vote result had undefined in it, something has gone wrong"
    );
  }

  if (result.game1.votes === result.game2.votes) {
    return result.game1.votedByWill ? result.game1 : result.game2;
  } else {
    return result.game1.votes > result.game2.votes
      ? result.game1
      : result.game2;
  }
}

async function GetPairingResult(result: VoteResult) {
  const gameChoice: prompts.Choice[] = [
    {
      title: result.game1.name,
      value: result.game1,
    },
    {
      title: result.game2.name,
      value: result.game2,
    },
  ];

  console.log(`\n${result.game1.name} vs ${result.game2.name}`);
  const vote1 = await prompts(
    {
      type: "number",
      name: "count",
      message: `Enter Number of Votes for ${result.game1.name}`,
      initial: 0,
      min: 0,
      max: numVoters,
    },
    onCancel
  );

  const will = await prompts(
    {
      type: "select",
      name: "data",
      message: "Select Game Will Voted For",
      choices: gameChoice,
    },
    onCancel
  );

  result.game1.votes = vote1.count;
  result.game2.votes = numVoters - vote1.count;

  const notWill = will.data.id == result.game1.id ? result.game2 : result.game1;
  will.data.votedByWill = true;
  notWill.votedByWill = false;

  // Set the current number of voters in case this changes throughout the tourney
  result.game1.numVoters = numVoters;
  result.game2.numVoters = numVoters;
}

export async function loadOpeningResults() {
  return readFileJSON<OpeningResults>(openingResultsFile);
}

export async function loadWinnerResults() {
  const res = await readFileJSON<BracketResults>(winnerResultsFile);
  return res === undefined ? {} : res;
}

export async function loadLoserResults() {
  const res = await readFileJSON<BracketResults>(loserResultsFile);
  return res === undefined ? {} : res;
}

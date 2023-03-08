import {
  CategoriesResults,
  AtlasGame,
  getCategories,
  getMechanics,
  MechanicsResults,
  search,
  emptyAtlasGame,
} from "boardGameAtlas.js";
import {
  BoardGameDetailRow,
  BoardGameRow,
  readGames,
  writeCategories,
  writeGames,
  writeMechanics,
} from "csv.js";
import prompts from "prompts";
import { writeFile } from "fs/promises";
import path from "path";

const exportFile = path.resolve(__dirname, "resources/boardGameData.json");

interface FullGame extends BoardGameRow, AtlasGame {}

export class RetrieveService {
  mechanicsRes: MechanicsResults;
  mechanics: Map<string, string>;
  categoriesRes: CategoriesResults;
  categories: Map<string, string>;
  games: FullGame[] = [];

  private constructor(
    mechanicsRes: MechanicsResults,
    categoriesRes: CategoriesResults
  ) {
    this.mechanicsRes = mechanicsRes;
    this.mechanics = new Map();
    this.mechanicsRes.mechanics.forEach((m) => {
      if (m.name !== null) {
        this.mechanics.set(m.id, m.name);
      }
    });

    this.categoriesRes = categoriesRes;
    this.categories = new Map();
    this.categoriesRes.categories.forEach((c) => {
      if (c.name !== null) {
        this.mechanics.set(c.id, c.name);
      }
    });
  }

  /**
   * Init a retrieve service using data direct from Board Game Atlas
   * @returns
   */
  static async LoadFromAtlas(): Promise<RetrieveService | undefined> {
    try {
      const mechs = await getMechanics();
      const cats = await getCategories();
      return new RetrieveService(mechs, cats);
    } catch (error) {
      console.error(error);
      console.error("Encountered error retrieving mechanics and categories");
      return undefined;
    }
  }

  /**
   * Do a search for a title on Board Game Atlas returning all games the have
   * a name that is close to the given title
   * @param title
   * @returns
   */
  async searchExact(title: string) {
    return await search({ name: title, fuzzy_match: false, exact: true });
  }

  /**
   * Do a search for a title on Board Game Atlas returning only an exact name match
   * @param title
   * @returns
   */
  async searchFuzzy(title: string) {
    return await search({ name: title, fuzzy_match: true, exact: false });
  }

  /**
   * Search Board Game Atlas for a title. Use fuzzy search if exact name doesn't locate
   * the entry. Prompt user to select the correct game from a list of fuzzy results
   * @param title name of the game to find
   * @returns Board Game Atlas Object for title
   *          Underfined if not found
   */
  async findAtlasEntry(title: string) {
    try {
      let res = await this.searchExact(title);
      if (res && res.count > 0) {
        return res.games[0];
      }
      console.log(`Exact search for ${title} failed, trying fuzzy search`);

      res = await this.searchFuzzy(title);
      if (res && res.count > 0) {
        console.log(`Fuzzy search returned ${res.count} matches`);
        if (res.count == 1) {
          return res.games[0];
        }

        return await selectGameFromMultiple(title, res.games);
      } else {
        console.error(`Unable to find any results for ${title}`);
      }
    } catch (error) {
      console.error(error);
      console.error(`Errored on searching for ${title}`);
    }
    return undefined;
  }

  /**
   * Load all of the games from the input CSV file and lookup the
   * corresponding Board Game Atlas entries
   */
  async loadGamesCsv() {
    const games = await readGames();
    console.log(`Successfully parsed CSV file - Loaded ${games.length} games`);
    for (const game of games) {
      if (!game["Not Game"]) {
        const atlasGame = await this.findAtlasEntry(game.Title);
        if (atlasGame !== undefined) {
          logGameEntry(game.Title, atlasGame);
          this.games.push({
            ...game,
            ...atlasGame,
          });
        } else {
          this.games.push({
            ...game,
            ...emptyAtlasGame,
          });
        }
      } else {
        // This is a non-game item, add it without any info from atlas
        this.games.push({
          ...game,
          ...emptyAtlasGame,
        });
      }
    }
  }

  /**
   * Write out all the games to CSV with the new detail loaded in
   * from Board Game Atlas
   */
  async writeGamesCsv() {
    const detailGames = this.games.map((game) => fillInDetailRow(game));
    await writeGames(detailGames);
  }

  /**
   * Write to csv a row for each game containing its listed categories
   */
  async writeCategoriesCsv() {
    const gameCategories = this.games.map((game) => {
      const cats = game.categories
        .map((cat) => this.categories.get(cat.id))
        .filter((cat): cat is string => cat !== undefined)
        .sort();
      cats.unshift(game.Title);
      return cats;
    });
    await writeCategories(gameCategories);
  }

  /**
   * Write to csv a row for each game containing its listed mechanics
   */
  async writeMechanicsCsv() {
    const gameMechanics = this.games.map((game) => {
      const mechs = game.mechanics
        .map((mech) => this.mechanics.get(mech.id))
        .filter((mech): mech is string => mech !== undefined)
        .sort();
      mechs.unshift(game.Title);
      return mechs;
    });
    await writeMechanics(gameMechanics);
  }

  /**
   * Export all collected game data to a JSON file
   */
  async exportJson() {
    const exportData = {
      ...this.mechanics,
      ...this.categories,
      games: this.games,
    };
    await writeFile(exportFile, JSON.stringify(exportData, null, "\t"));
  }

  /**
   * Get all of the games that were not able to locate an
   * entry on Board Game Atlas
   */
  getMisses() {
    return this.games.filter((game) => game.id === "" && !game["Not Game"]);
  }
}

/**
 * Prompt the user to select from multiple options returned from a fuzzy search
 */
async function selectGameFromMultiple(title: string, gameResults: AtlasGame[]) {
  console.log(`\n${title} returned ${gameResults.length} possible options`);

  // set initial prompt for selecting none
  const choices: prompts.Choice[] = [
    {
      title: "None",
      value: -1,
      description: "No matching titles",
    },
  ];

  // add prompt option for each game
  gameResults.forEach((game, i) => {
    let description = game.description_preview
      ? game.description_preview // only display the first 300 chars of desc
      : undefined;
    if (description && description.length > 300) {
      description = description.substring(0, 300).concat("...");
    }

    choices.push({
      title: game.name,
      value: i,
      description: description,
    });
  });
  const response = await prompts({
    type: "select",
    name: "value",
    message: `Select the correct game title for \"${title}\"`,
    initial: 1,
    choices: choices,
  });

  return response.value >= 0 && response.value < gameResults.length
    ? gameResults[response.value]
    : undefined;
}

function removeNull(v: string | number | null | undefined): string {
  return v === null || v === undefined ? "" : v.toString();
}

function fillInDetailRow(game: FullGame): BoardGameDetailRow {
  return {
    Title: game.Title,
    Category: game.Category,
    Size: game.Size,
    "Not Game": game["Not Game"],
    Expansion: game.Expansion,
    Stolen: game.Stolen,
    "Atlas Name": removeNull(game.year_published),
    "Year Published": removeNull(game.year_published),
    "Min Players": removeNull(game.min_players),
    "Max Players": removeNull(game.max_players),
    "Min Playtime": removeNull(game.min_playtime),
    "Max Playtime": removeNull(game.max_playtime),
    "Min Age": removeNull(game.min_age),
    Price: removeNull(game.price),
    MSRP: removeNull(game.msrp),
    "Primary Publisher": removeNull(game.primary_publisher?.name),
    "Primary Designer": removeNull(game.primary_designer?.name),
    "Reddit All Time Count": removeNull(game.reddit_all_time_count),
    "Reddit Week Count": removeNull(game.reddit_week_count),
    "Reddit Day Count": removeNull(game.reddit_day_count),
    "Add Date": new Date().toDateString(),
  };
}

function logGameEntry(title: string, atlasGame: AtlasGame) {
  console.log(`\nSuccessfully added ${title}`);
  console.log(`\tatlas id - ${atlasGame.id}`);
  if (title !== atlasGame.name) console.log(`\tatlas name - ${atlasGame.name}`);
}

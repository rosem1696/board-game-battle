import { RetrieveService } from "retrieveService.js";

async function main() {
  const retrieveService = await RetrieveService.LoadFromAtlas();
  if (!retrieveService) {
    console.error("Unable to initialize retrieval service");
    return;
  }
  try {
    await retrieveService.loadGamesCsv();
  } catch (error) {
    console.error(error);
    console.error("Encountered error loading CSV file");
    return;
  }
  try {
    console.log("Writing games to CSV");
    await retrieveService.writeGamesCsv();

    console.log("Writing mechanics to CSV");
    await retrieveService.writeMechanicsCsv();

    console.log("Writing categories to CSV");
    await retrieveService.writeCategoriesCsv();

    console.log("Exporting retrieve service data as JSON");
    await retrieveService.exportJson();
  } catch (error) {
    console.error(error);
    console.error("Encountered error exporting data from service");
  }

  const misses = retrieveService.getMisses();
  if (misses.length > 0) {
    console.log(`\nUnable to retrieve data for ${misses.length} games\n`);
    misses.forEach((game) => console.log(game.Title));
  }
}

await main();
console.log("Exiting");

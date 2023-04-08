# Tournament Rankings

## Goal

Identify the quality of a series of board games using input from a group of players. Ranking must have resolution enough to identify the bottom 50% of games.

## Method

Do a tournament style ranking system in which games face off against one another 1v1. Player votes will decide the winner of each individual matchup

### Tournament Bracket Details

- 88 games = 44 initial pairings
- 44 pairs, 44 advance
- 22 pairs, 22 advance
- 11 pairs, 11 advance
- 4 pairs, 8 advance
- 4 pairs, 4 advance
- 2 pairs, 2 advance
- Crowning match

Repeat for the losing 4 in a losers tournament

### Ranking

Games will be primarily ranked by their number of wins in the tournament. Results of losers tournament are inverted.

Ties are broken first using average number of votes.

Ties after the first breaker are broken by number of votes by Will

Ties after Will are broken by if the game won in the first round

Final ties will need further assessment

## Generation

Initial pairings should be determined by similarity with some randomness still involved.

Use a score system to determine randomness

- Base score of 10
- Same max players = + 20
- Max Player +/- 1 = +10
- Min Player same = +5
- Same Min & Max = \* 1.5
- Playtime within 30 min = +10
- Playtime Exact = \* 1.2
- Same Size = +20

Select a target game at random. Calculate the score for each other game in regards to the target.

Generate a number between 0 and the total scores of all games. Starting with 0, Iterate through the games adding their score to a total. Stop when the total goes over the rolled number.

Remove the target and selected games from the list and add them as a pairing.

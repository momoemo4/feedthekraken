# Long Journey Map Audit

Map status: **USER REVIEW REQUIRED**  
Playable cells: **31**  
Reference image in local audit build: **YES**  
Gameplay movement enabled: **NO**

Edge notation is `edge → target`. An asterisk (`*`) means that directed exit crosses the dashed Supply Line. A blank means the photographed cell has no exit of that color.

| Hex | q | r | Red exit | Blue exit | Yellow exit | Special / region | Verified |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| H01 | 0 | -3 | — | — | — | Kraken victory | YES |
| H02 | 1 | -3 | — | — | — | Sailor victory | NO — banner |
| H03 | 2 | -3 | — | — | — | Sailor victory | YES |
| H04 | 3 | -3 | — | — | — | Sailor victory | YES |
| H05 | -1 | -2 | — | — | — | Pirate victory | NO — banner |
| H06 | 0 | -2 | NW → H05 | E → H02 | NE → H01 | Feed the Kraken | YES |
| H07 | 1 | -2 | NW → H06 | E → H03 | NE → H02 | Feed the Kraken | YES |
| H08 | 2 | -2 | NW → H07 | NE → H03 | NW → H07 | — | YES |
| H09 | 3 | -2 | NW → H08 | NE → H04 | NW → H08 | Right boundary | YES |
| H10 | -2 | -1 | — | — | — | Pirate victory | YES |
| H11 | -1 | -1 | NW → H10 | E → H06 | NE → H05 | Feed the Kraken | YES |
| H12 | 0 | -1 | NW → H11 | E → H07 | NE → H06 | — | YES |
| H13 | 1 | -1 | NW → H12 | E → H08 | NE → H07 | Flogging | YES |
| H14 | 2 | -1 | NW → H13 | E → H09 | NE → H08 | — | YES |
| H15 | -3 | 0 | — | — | — | Pirate victory | YES |
| H16 | -2 | 0 | NE → H10 | E → H11 | E → H11 | — | YES |
| H17 | -1 | 0 | NW → H16 | E → H12 | NE → H11 | Flogging | YES |
| H18 | 0 | 0 | NW → H17* | E → H13* | NE → H12* | Off With The Tongue | YES |
| H19 | 1 | 0 | NW → H18 | E → H14* | NE → H13* | — | YES |
| H20 | -3 | 1 | NE → H15 | E → H16 | E → H16 | Left boundary | YES |
| H21 | -2 | 1 | NW → H20 | E → H17 | NE → H16 | — | YES |
| H22 | -1 | 1 | NW → H21* | E → H18 | NE → H17* | — | YES |
| H23 | 0 | 1 | NW → H22 | E → H19 | NW → H22 | Cabin Search | YES |
| H24 | 1 | 1 | NW → H23 | E → H31 | NE → H19* | Cabin Search | YES |
| H25 | -2 | 2 | NE → H21* | E → H22 | NE → H21* | Cabin Search; left funnel | YES |
| H26 | -1 | 2 | NW → H25 | E → H23 | NE → H22 | Cabin Search | YES |
| H27 | 0 | 2 | NW → H26 | E → H24 | NE → H23 | — | YES |
| H28 | 1 | 2 | NW → H27 | NE → H24 | NE → H24 | Lower-right convergence | YES |
| H29 | -1 | 3 | NE → H26 | E → H27 | NE → H26 | Lower-left convergence | YES |
| H30 | 0 | 3 | NW → H29 | E → H28 | NE → H27 | Starting ship | YES |
| H31 | 2 | 0 | NW → H19* | NE → H14* | NE → H14* | Right Supply Line funnel | YES |

## Confirmed counts

- 4 Cabin Search
- 2 Flogging
- 1 Off With The Tongue
- 3 Feed the Kraken
- 3 Pirate destination cells
- 3 Sailor destination cells
- 1 Kraken destination cell

## Review gate

The map-level `verified` flag must remain false until H02 and H05 are approved despite the printed victory banners covering parts of their borders. Movement implementation begins only after that sign-off.

# Rule Assumptions

## Confirmed by the user

- The ship travels from the bottom toward the three destination regions at the top.
- Movement follows the pointed end of each colored triangle.
- Magnifying glass = Cabin Search; bound figure = Flogging; blade = Off With The Tongue; sea-creature icon = Feed the Kraken.
- Crossing the dashed Supply Line for the first time triggers the refill.
- Pirate, Kraken, and Sailor colored regions are immediate destinations.
- The Long Journey board contains 31 playable cells.

## Geometry convention requiring review

The supplied flat-top center formula is implemented exactly:

```text
x = originX + 1.5 × radius × q
y = originY + sqrt(3) × radius × (r + q / 2)
```

The supplied edge labels are displayed exactly as `NW / NE / E / SE / SW / W`. For the forward half of a flat-top cell, the audit uses `NW = upper-left`, `NE = top`, and `E = upper-right`. The reverse three edges follow clockwise. Exit targets are now validated against this convention.

## Remaining sign-off

Thirty-one playable cells and their photographed exits are encoded. The Pirate/Sailor banners partly cover H05 and H02, so the map-level flag remains `verified: false` until the user reviews the overlay and approves those two cells.

## Reference image handling

The supplied reference is available only in the local audit build. A replacement selected with the file picker is held as a browser object URL for the current session and is not sent to Express or stored in SQLite. The source photo must be removed before any public release.

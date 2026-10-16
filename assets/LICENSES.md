# Assets and licences

| File | Origin | Licence |
|---|---|---|
| `icon.png`, `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, `favicon.png` | AI-generated for the author of this game (pixel-art "GANJA FARMER" artwork), reused from the author's earlier prototype | owned by the author, published with this repository |
| `splash-icon.png` | same artwork, landscape version (1536x1024) | owned by the author, published with this repository |
| `sfx/*.wav` (10 short sound effects) | synthesised by `scripts/generate-sfx.mjs` in this repository (no samples, no third-party audio) | same licence as the code |

Background music ("Rasta Rocket Man") is **not in this repository**: it was generated with Suno on the free plan,
which does not allow redistribution. The author keeps it locally in `assets/music/local/` (git-ignored);
`metro.config.js` bundles it only when present. Builds from this repository have no background music.

The MIT licence (`LICENSE`) covers the source code. The images above are the author's artwork, published with this
repository for building the game; they are not offered under MIT.

In-game graphics are drawn in code with Skia (`src/render/renderer.ts`): no image files.

"Ganja Farmer" is a tribute to the 1998 freeware of the same name (EvilX Systems); this project is not affiliated
with its creators and contains none of its files.

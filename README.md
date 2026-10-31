# Clan Site

A config-driven recruitment site for any **Clash of Clans** clan. Live clan data, a war room, a roster, and full player profiles. Edit one JSON file to make it yours. No build step.

## Quick start

1. **Fork or clone** this repo.
2. Edit **`public/config.json`**: set `clanTag`, then change the text, colors, perks and join steps.
3. Get an API key at [developer.clashofclans.com](https://developer.clashofclans.com).
4. Deploy to **Vercel** and add the env var `COC_API_TOKEN`.

```bash
npm i -g vercel
cp .env.example .env     # add your token
vercel dev               # http://localhost:3000
```

> **API keys are IP-locked.** Vercel has no fixed IP, so use a proxy such as `https://cocproxy.royaleapi.dev/v1`: set `COC_API_BASE` to it and create your key with the proxy's IP (see the RoyaleAPI docs).

## What you can change in `config.json`

| Key | What it does |
|---|---|
| `clanTag` | Your clan, e.g. `"#2CYGVVU9Y"` |
| `refreshSeconds` | How often live data refreshes |
| `useClanDescription` | `true` shows the in-game clan description instead of `hero.lead` |
| `theme` | Colors: `red`, `yellow`, `green`, `blue`, `bg`, `card`, `card2`, `line`, `ink` (text and outlines), `sub` (muted text). Dark mode: swap the light values for dark ones |
| `sections` | Turn `why`, `champions`, `war`, `roster` on or off |
| `hero`, `why`, `champions`, `war`, `roster`, `join`, `footer` | All page text |
| `why.perks[]` | `title`, `text`, `icon`, `color` (`red`, `yellow`, `green`, `blue`) |
| `join.steps[]` / `join.requirements[]` | Join steps and clan rules |

`icon` is either a path on the [ClashKing assets CDN](https://github.com/ClashKingInc/ClashKingAssets) (e.g. `heroes/archer_queen/icon.webp`) or a full `https://` image URL.

All config text is inserted as plain text, so HTML is not supported in values.

## Project layout

```
public/
  index.html   landing page
  stats.html   full stats page
  common.css   shared styles
  common.js    shared logic (config, images, roster, player dialog)
  config.json  <- your content
api/
  clan.js      GET /api/clan
  player.js    GET /api/player?tag=
```

The API files use CommonJS. If your `package.json` sets `"type": "module"`, convert them to `export default`.

## Contributing

Issues and PRs are welcome. Keep the site dependency-free (plain HTML, CSS and JS), and put anything a clan might want to customize in `config.json` rather than hard-coding it.

## License

MIT. Not affiliated with Supercell. Clash of Clans is a trademark of Supercell. Game art via ClashKing Assets.
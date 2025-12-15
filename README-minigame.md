# ZAIN'S TRAVEL HOP (React + Phaser 3)

Retro-styled 2D platformer in a single React component with Phaser 3. Ten themed countries, Scottish hero, retro physics and collectibles, plus simple enemies and power-ups.

## Run

```bash
npm install
npm run dev
```
Open http://localhost:5173/minigame

## Controls
- Left / Right: Move
- Up / Space: Jump (double jump when wing power-up is active)
- ESC: Return to homepage
- 🔊/🔇: Mute/unmute (top-right). +/-: Adjust volume.

## Features
- 10 Levels: Scotland, Japan, Egypt, Brazil, France, USA, Italy, India, Australia, Scotland Finale.
- Scottish Hero: Tartan kilt + tam o’ shanter, simple idle/walk/jump frames.
- Themed Enemies & Collectibles: Simple retro shapes/colours per country.
- Power-ups: Double jump (wing), Higher jump (spring) with HUD timers.
- Flag Goal: Scottish flag unlocks next level.
- Phrases: Jump "OH AYE!", Finish "FREEEDOMMM!", Lose "Canny Beat it.".

## Notes
- Music file expected at `public/audio/title-music.mp3`. If missing, game runs silently.
- All assets are generated procedurally; no external images needed.
- Saved audio preferences in localStorage key `zth_audio`.

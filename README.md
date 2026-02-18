# 7 Simul Memo Trainer

A browser-based trainer for memorising Rubik’s Clock 7 simul memo.

You can use the trainer at https://kittatamsaisaard.github.io/7-Simul-Memo-Trainer/

This repository is a fork of the original project by JoshM2.

Original repository:
https://github.com/JoshM2/7-Simul

Huge credit to JoshM2 for building the foundation of this trainer. This fork builds on that base with additional training tools, UI changes and progress tracking features.

## What’s new in this fork

### ✅ Training stats (persistent)
Stats are stored locally in your browser (localStorage) and include:
- Total solves
- Success rate
- Current streak (consecutive correct solves)
- Export stats to CSV
- Delete last stat
- Clear all stats (requires typing `DELETE`)

### 🧪 Practice Mode
Practice Mode does not count your attempts towards your stats.

### 🕰 Hour indicator toggle
You can hide/show the hour indicators on the clock display. This is useful if you want to only see the positions of the clock hands and avoid relying on counting the hour indicators.

### 🔗 URL parameter for default pin orders
You can load a default pin order on page load via query params:
- `?type=bpaul` (default)
- `?type=tommy`

Example:
- index.html?type=tommy

Any other value for the `type` parameter will default to `bpaul`.

## How to use/run
You can use the trainer at https://kittatamsaisaard.github.io/7-Simul-Memo-Trainer/

Alternatively, you can also download and run locally:

1. Clone the repo
2. Open `index.html` in your browser

This project is plain HTML/CSS/JS.
No build step required.

## Controls / usage
- Scramble using the on-page scramble control (or your configured keyboard shortcuts)
- Enter memo using the on-screen letter buttons (or your configured keyboard shortcuts)
- Toggle settings as needed (simul type, hour indicators, execution mode, etc.)
- Use the Stats panel to track progress over time

## Data & privacy
All stats are stored locally in your browser only. Export to CSV if you want to back up your results.

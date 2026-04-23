# YourEx: Sci-Fi Regex Adventure VS Code Extension

YourEx is a sci-fi themed interactive regex adventure for Visual Studio Code. Solve regex puzzles, unlock achievements, and explore a futuristic codex—all within your editor.

## Features
- **Interactive Regex Challenges**: Progress through story-driven levels with unique regex puzzles.
- **Hint System**: Get contextual hints and a one-time decrypt-all feature to help you advance.
- **Sci-Fi Codex Manual**: Access a comprehensive, in-universe regex reference manual from the Manual button.
- **Achievements & Leaderboard**: Track your progress, earn rewards, and compare scores.
- **User & Developer Modes**: Switch between standard play and developer mode for testing.
- **Internationalization (i18n)**: English and Chinese UI support.

## Installation
### From VSIX
1. Build the extension:
   ```sh
   npm run build
   ```
2. Package the extension:
   ```sh
   npm run package-prod
   ```
   This creates a `.vsix` file in the `dist/` folder.
3. Install in VS Code:
   - Open the Command Palette (`Ctrl+Shift+P`)
   - Select `Extensions: Install from VSIX...`
   - Choose the generated `.vsix` file

### From Marketplace (when available)
- Search for `YourEx` in the VS Code Extensions Marketplace and install directly.

## Usage
- Open the Command Palette and run `YourEx: Start` to begin your adventure.
- Use the **Manual** button in the prompt panel to access the regex codex.
- Switch between User and Developer modes via the extension settings or commands.
- Track your achievements and scores in the sidebar.

## Development
- **Build extension:**
  ```sh
  npm run build
  ```
- **Run tests:**
  ```sh
  npm test
  ```
- **Build webview UI only:**
  ```sh
  npm run build:webview
  ```
- **Watch mode:**
  ```sh
  npm run watch
  ```

## Project Structure
- `src/` — Extension backend (TypeScript)
- `webview-ui/` — React webview UI (Vite, TypeScript)
- `prompt/` — Design docs, plans, and feature specs
- `test/` — Unit tests
- `resources/` — Icons and static assets

## Credits
- Developed by kokomaya
- Icon and sci-fi codex design by kokomaya

## License
[MIT](LICENSE)

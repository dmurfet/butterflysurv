# 🏮 The Celestial Palace Cipher 🏮
### 天宫密码

An educational puzzle game that teaches the **Chinese Remainder Theorem** through beautiful Chinese classical mythology and art.

![Game Banner](assets/creatures/dragon_red.png)

## 🎮 Game Overview

The Celestial Palace has fallen into disarray! As the chosen guardian, you must restore balance by arranging mythical creatures according to the ancient modular arithmetic laws. Each level presents a grid where creatures must be placed to satisfy multiple simultaneous modular constraints - the essence of the Chinese Remainder Theorem.

## 🐉 Features

### Educational Mathematics
- **Progressive Learning**: 9 carefully designed levels teaching the Chinese Remainder Theorem from basics to advanced
- **Visual CRT**: See modular arithmetic come to life through puzzle-solving
- **Hint System**: Stuck? Get mathematical hints to guide your way
- **Tutorial Level**: Interactive introduction to the theorem

### Chinese Classical Art
- **Mythical Guardians**: Dragons (red, gold, jade), Phoenix, Qilin, Black Tortoise (Xuanwu)
- **Traditional Aesthetics**: Cinnabar red, imperial gold, jade green color palette
- **Animated Sprites**: Floating, glowing creatures with particle effects
- **Palace Atmosphere**: Ink painting-style backgrounds, lanterns, traditional patterns

### Technical Features
- **Zero Dependencies**: Pure vanilla JavaScript, HTML5 Canvas
- **Smooth Animations**: Custom animation engine with particle systems
- **CRT Solver**: Complete implementation of the Chinese Remainder Theorem algorithm
- **Responsive Design**: Works on desktop and mobile
- **No Build Tools**: Just open index.html and play!

## 📚 The Chinese Remainder Theorem

The Chinese Remainder Theorem (CRT) is an ancient mathematical principle that states:

If you have a system of congruences:
```
x ≡ a₁ (mod n₁)
x ≡ a₂ (mod n₂)
...
x ≡ aₖ (mod nₖ)
```

And if n₁, n₂, ..., nₖ are pairwise coprime, then there exists a **unique solution** x (mod N) where N = n₁ × n₂ × ... × nₖ

### Example Puzzle

Find x such that:
- x ≡ 1 (mod 3)  [x gives remainder 1 when divided by 3]
- x ≡ 2 (mod 5)  [x gives remainder 2 when divided by 5]

**Solution**: x = 7 (try it!)

The game teaches you how to solve these systematically!

## 🎯 How to Play

1. **Select a Level**: Start with "Dragon's First Step" to learn the basics
2. **Read the Constraints**: Each cell shows its modular requirements
3. **Drag Guardians**: From the bank at the bottom to the grid cells
4. **Match All Constraints**: Place creatures with numbers that satisfy ALL constraints for each cell
5. **Complete the Level**: When all cells are correctly filled, you advance!

### Controls
- **💡 Hint**: Get help with the first cell's solution
- **🔄 Reset**: Clear the current level and start over
- **Next Level ➔**: Proceed after completing a level
- **☰ Menu**: Return to level selection

## 🌟 The Four Celestial Guardians

### Dragon (龙)
- **Colors**: Red (traditional), Gold (imperial), Jade (mystical)
- **Symbolism**: Power, wisdom, imperial authority
- **In-game**: Represents numbers 0, 1, 2, and cycles for higher values

### Phoenix (凤)
- **Appearance**: Brilliant red and gold plumage, long tail feathers
- **Symbolism**: Rebirth, grace, celestial harmony
- **In-game**: Represents number 3 and cycles

### Qilin (麒麟)
- **Appearance**: Jade green scales, dragon head, deer antlers
- **Symbolism**: Prosperity, serenity, good fortune
- **In-game**: Represents number 4 and cycles

### Black Tortoise - Xuanwu (玄武)
- **Appearance**: Tortoise with snake coiled around shell
- **Symbolism**: Longevity, protection, northern direction
- **In-game**: Represents number 5 and cycles

## 🗂️ Project Structure

```
the-celestial-palace-cipher/
├── index.html              # Main game page
├── styles.css              # Chinese classical styling
├── game.js                 # Main game logic & rendering
├── crt.js                  # Chinese Remainder Theorem solver
├── animations.js           # Animation engine & particle system
├── levels.js               # Level definitions (9 levels)
├── assets/
│   ├── creatures/
│   │   ├── dragon_red.png      # Red dragon sprite
│   │   ├── dragon_gold.png     # Golden dragon sprite
│   │   ├── dragon_jade.png     # Jade dragon sprite
│   │   ├── phoenix.png         # Phoenix sprite
│   │   ├── qilin.png           # Qilin sprite
│   │   └── tortoise.png        # Black Tortoise sprite
│   ├── backgrounds/
│   │   └── palace_tile.png     # Palace floor tile
│   └── particles/
│       └── sparkle.png         # Particle effect sprite
├── netlify.toml           # Deployment configuration
└── README.md              # This file
```

## 🚀 Local Setup

### Quick Start
```bash
# Simply open the HTML file
open index.html

# Or use a local server (optional)
python -m http.server 8000
# Then visit http://localhost:8000
```

No installation, no build process, no dependencies!

## 🌐 Deploy to Netlify

### Option 1: Drag & Drop
1. Sign up at [netlify.com](https://netlify.com) (free)
2. Drag the entire project folder to Netlify dashboard
3. Your game is live!

### Option 2: GitHub
```bash
# Initialize git
git init
git add .
git commit -m "Add Celestial Palace Cipher game"

# Create GitHub repo and push
gh repo create celestial-palace-cipher --public --source=. --remote=origin --push

# Connect to Netlify
# Go to netlify.com → New site from Git → Select your repo
```

The `netlify.toml` file is already configured!

## 🎨 Asset Generation

All pixel art was generated using **PixelLab AI** with these specifications:

- **Size**: 48×48px for creatures, 32×32px for tiles
- **Style**: Isometric, highly detailed
- **Shading**: Detailed shading for depth
- **Outline**: Single color outline
- **Theme**: Traditional Chinese mythology

## 🧮 Mathematical Implementation

### CRT Algorithm (crt.js)

The game implements a complete CRT solver including:

- **Extended Euclidean Algorithm**: For finding modular inverses
- **CRT Solver**: Finds unique solutions to systems of congruences
- **Validation**: Checks if a value satisfies all constraints
- **Puzzle Generation**: Creates solvable CRT puzzles

Example usage:
```javascript
// Solve: x ≡ 1 (mod 3) AND x ≡ 2 (mod 5)
const solution = solveCRT([1, 2], [3, 5]);
console.log(solution); // Output: 7

// Validate
const isValid = validateSolution(7, [
  { remainder: 1, modulus: 3 },
  { remainder: 2, modulus: 5 }
]);
console.log(isValid); // Output: true
```

## 📖 Learning Path

### Level Progression

1. **Tutorial**: Intro to modular arithmetic
2. **Level 1-3**: Two moduli (mod 3, mod 5)
3. **Level 4-5**: Three moduli (mod 2, mod 3, mod 5)
4. **Level 6-7**: Larger moduli (mod 7, mod 11)
5. **Level 8**: Grand finale with complex constraints

Each level builds on previous concepts!

## 🎭 Cultural Elements

### Design Philosophy

The game celebrates Chinese classical culture through:

- **Color Palette**:
  - Cinnabar Red (朱砂红): Traditional pigment, imperial color
  - Imperial Gold (金黄): Prosperity, celestial realm
  - Jade Green (翠绿): Harmony, immortality

- **Typography**:
  - Ma Shan Zheng: Flowing calligraphy-style title font
  - Noto Serif SC: Traditional serif for body text

- **Patterns**:
  - Cloud motifs (云纹)
  - Traditional borders and frames
  - Ink painting aesthetics

## 🌟 Future Enhancements

Potential additions:
- [ ] More mythical creatures (Azure Dragon, White Tiger)
- [ ] Traditional Chinese music soundtrack
- [ ] Story mode with narrative
- [ ] Multiplayer race mode
- [ ] Daily challenge puzzles
- [ ] Achievement system (collect jade seals)
- [ ] CRT calculator tool for learning
- [ ] Animated cutscenes between levels
- [ ] More complex grid shapes (triangular, hexagonal)

## 📜 Credits

- **Game Design & Development**: Built with Claude Code
- **Pixel Art**: Generated with PixelLab AI
- **Mathematical Foundation**: Chinese Remainder Theorem (ancient Chinese mathematics)
- **Fonts**: Google Fonts (Ma Shan Zheng, Noto Serif SC)
- **Inspiration**: Chinese classical mythology and mathematics education

## 📄 License

This project is free to use for educational purposes. All pixel art assets were generated using PixelLab AI.

---

**Built with ❤️ for mathematics education and Chinese cultural appreciation**

天宫密码 - Where ancient mathematics meets mythical guardians! 🐉🔥

# 🎯 Spin & Win — Farcaster Mini App

**Spin & Win** is a Farcaster-integrated roulette game built with **React + Vite + TailwindCSS**, where users can connect their wallet, spin the wheel, and win MON tokens on Monad Testnet.

Live Demo: [🌐 wheel.exapp.xyz](https://wheel.exapp.xyz)

---

## 🧩 Features

- 🌀 Interactive spin wheel with weighted rewards  
- 🔗 Wallet connection via [Reown AppKit](https://reown.io)  
- 🧠 Farcaster integration with [Frame SDK](https://miniapps.farcaster.xyz/docs)  
- 🪄 Custom spin limits per address (`getMaxSpinsForAddress`)  
- 💾 Local storage tracking for daily spins  
- 🎉 Share winnings directly to Farcaster  
- 🧭 Monad Testnet transaction links

---

## 🛠️ Tech Stack

| Category | Tools |
|-----------|--------|
| Framework | [React](https://react.dev) + [Vite](https://vitejs.dev) |
| Styling | [TailwindCSS](https://tailwindcss.com) |
| Wallet & Chain | [Reown AppKit](https://reown.io) + [Wagmi](https://wagmi.sh) |
| Farcaster | [Frame SDK](https://miniapps.farcaster.xyz) |
| Game Engine | [react-custom-roulette](https://github.com/gndx/react-custom-roulette) |
| Build & Dev | TypeScript, Biome, PostCSS |

---

## 🚀 Getting Started

### 1️⃣ Clone & Install
```bash
git clone https://github.com/<your-username>/spin-wheel.git
cd spin-wheel
npm install
```

### 2️⃣ Set Environment Variables
Create a `.env` file in the root:

```bash
VITE_API_SPIN=https://your-backend/api/spin
VITE_API_ENRICHED=https://your-backend/api/enriched
VITE_API_HISTORY=https://your-backend/api/history
```

### 3️⃣ Run Locally
```bash
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173)

---

## 🧠 How to Play

1. Connect your wallet using the **AppKit** button (top right).  
2. You get a limited number of daily spins — based on your wallet.  
3. Press **“Spin Now”** and try your luck!  
4. If you win MON tokens, a transaction will be sent to your wallet.  
5. Share your win directly to Farcaster with one click 🚀

---

## 🧱 Folder Structure

```
src/
 ┣ components/
 ┃ ┣ SpinWheel.tsx       # main spin logic
 ┃ ┣ WinnersHistory.tsx  # recent winners list
 ┃ ┗ ConnectMenu.tsx     # wallet connect button
 ┣ utils/
 ┃ ┗ specialSpins.ts     # custom spin limit logic
 ┣ App.tsx
 ┗ main.tsx
```

---

## 🧰 Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Run local dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview build output |
| `npm run lint` | Check code style using Biome |

---

## 🪙 Example Rewards

| Reward | Probability |
|--------|--------------|
| 0.05 MON | Common |
| 0.1 MON | Uncommon |
| 0.3–1 MON | Rare |
| 2–3 MON | Very Rare |
| Thanks | 😅 No luck this time |

---

## 🧑‍💻 Author

Built with ❤️ by [@return](https://warpcast.com/return)  
Powered by **Farcaster Frames** + **Monad Testnet**

---

## 🪄 License

MIT License © 2025 — Feel free to fork, remix, and spin your own luck!

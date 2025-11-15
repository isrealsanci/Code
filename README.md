# Spin & Win — Farcaster Mini App (Frame v2)

Spin & Win is a Farcaster Mini App built with **Vite + React + TypeScript**, designed to let users connect their wallet and spin a doodle-style reward wheel. The project integrates Farcaster Frame SDK, Wagmi, AppKit, and a custom backend reward distribution flow.

---

## 🚀 Features

- 🎡 **Doodle-style Spin Wheel** (react-custom-roulette)
- 🟣 **Farcaster Frame v2 integration**
- 🔌 **Wallet connection via AppKit + Wagmi**
- 🎁 **Daily spin limit system**
- 📜 **Winners history tracking**
- 🔐 **Backend reward distribution via custom API**
- 🎨 Cute UI with pastel doodle theme

---

## 📦 Tech Stack

- **React 18 + TypeScript**
- **Vite**
- **TailwindCSS**
- **Farcaster Frame SDK**
- **Wagmi + Viem**
- **AppKit**
- **TanStack React Query**
- **Neynar SDK**

---

## 📁 Project Structure (Simplified)

```
src/
 ├── components/
 │    ├── App.tsx
 │    ├── ConnectMenu.tsx
 │    ├── SpinWheel.tsx
 │    └── WinnersHistory.tsx
 ├── utils/
 │    ├── specialSpins.ts
 │    └── bannedAddresses.ts
 └── main.tsx
```

---

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/isrealsanci/Code.git
cd spin
```

*(Replace with your real repo URL)*

---

## 📥 Install Dependencies

Your project uses the following key libraries:

### Required packages (from package.json)

- react, react-dom
- tailwindcss
- @farcaster/frame-sdk
- @reown/appkit
- wagmi + viem
- react-custom-roulette
- tanstack/react-query
- vite, typescript

### Install everything:

```bash
npm install
```

---

## ▶️ Development

Run local dev environment:

```bash
npm run dev
```

---

## 🏗️ Build for Production

```bash
npm run build
```

Preview build output:

```bash
npm run preview
```

---

## 🧹 Linting

```bash
npm run lint
```

---

## 🔌 Environment Variables

Create `.env` file:

```
VITE_API_SPIN=https://your-backend-api.com/spin
```

Backend should return the txHash for successful reward distribution.

---

## 🎉 Credits

Made with ❤️ by **([sanci](https://github.com/isrealsanci/))**  
UI fully customized in doodle pastel style.

---

## 📄 License

MIT License

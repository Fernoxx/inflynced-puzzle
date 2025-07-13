# InflyncedPuzzle 🧩

An image-based sliding puzzle game built for Farcaster. Challenge yourself to solve image puzzles as fast as you can!

## 🎮 Features

- **Single Puzzle Challenge**: Each session features one randomly selected image puzzle
- **Real-time Progress Tracking**: Progress updates with every move based on correct tile positions
- **Sound Effects**: Audio feedback for moves, wins, and actions
- **Undo Functionality**: Take back your last move
- **Live Leaderboard**: See how you rank against other players with real scores
- **Social Sharing**: Share your completion time with the Farcaster community
- **Animated Background**: Beautiful particle effects and gradient backgrounds
- **Mobile Optimized**: Responsive design perfect for mobile play

## 🖼️ Image System

- **15 Different Puzzles**: Upload your own 15 images to `/public/images/`
- **3x3 Grid**: Each image is split into 9 pieces with one empty space
- **Auto-cropping**: Images are automatically sized and positioned correctly

## 🚀 Technologies

- React 18
- Tailwind CSS
- Lucide React Icons
- Web Audio API
- Progressive Web App (PWA)
- Vercel Serverless Functions

## 📱 Farcaster Integration

- Optimized for Farcaster frames
- Social sharing functionality
- Real leaderboard with Farcaster usernames
- Direct links to Warpcast profiles

## 🏆 How to Play

1. Click "Start Game" to begin
2. Slide tiles into the empty space to arrange them in order
3. Watch your progress increase as tiles reach correct positions
4. Use "Undo" to reverse your last move
5. Complete the puzzle as fast as possible
6. Share your time with friends!

## 📊 Progress System

- Progress updates in real-time based on correctly positioned tiles
- Each tile contributes ~12.5% to total completion (8 tiles total)
- Progress increases when tiles move to correct positions
- Progress decreases when correctly placed tiles are moved

## 🎵 Audio Features

- Move sounds when sliding tiles
- Success sounds when placing tiles correctly
- Victory sequence when completing puzzles
- Undo sound effects

## 🗂️ Leaderboard System

- Real user scores (no mock data)
- Automatic score submission on puzzle completion
- Clickable usernames linking to Farcaster profiles
- Gold/Silver/Bronze medals for top 3
- Refresh functionality for latest scores

## 🖼️ Adding Your Images

1. Create folder: `/public/images/`
2. Add 15 images named: `puzzle1.jpg`, `puzzle2.jpg`, ..., `puzzle15.jpg`
3. Images should be square (300x300px recommended)
4. Supported formats: JPG, JPEG, PNG

---

Built with ❤️ for the Farcaster community

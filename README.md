# SketchSpace

[![Latest Release](https://img.shields.io/github/v/release/AyushHurkat0022/SketchSpace?style=for-the-badge&label=Release&color=success)](https://github.com/AyushHurkat0022/SketchSpace/releases)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.8-B73BFE?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.14-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Node.js](https://img.shields.io/badge/Node.js-20.18.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.21.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io)
[![perfect--freehand](https://img.shields.io/badge/perfect--freehand-1.2.2-FF6B6B?style=for-the-badge)](https://github.com/steveruizok/perfect-freehand)
[![rough.js](https://img.shields.io/badge/rough.js-4.6.6-4ECDC4?style=for-the-badge)](https://roughjs.com)
[![lucide--react](https://img.shields.io/badge/lucide--react-0.483.0-000000?style=for-the-badge)](https://lucide.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5.0.0-rc.2-FF6B6B?style=for-the-badge)](https://zustand-demo.pmnd.rs/)

**SketchSpace** — A real-time collaborative whiteboard & sketching app. Draw together on an infinite canvas with smooth, natural strokes, live cursors, and instant sync. Perfect for brainstorming, teaching, design sprints, or fun doodle sessions.

## Features

- Real-time collaboration via Socket.IO
- Smooth, pressure-sensitive drawing with **perfect-freehand**
- Sketchy/hand-drawn style with **rough.js**
- Full toolset: Pencil, Brush, Eraser, Shapes, Fill, Color Options
- Undo/Redo
- Canvas shared simply by putting email
- JWT-based authentication
- Responsive on desktop, tablet & mobile
- Powered by Zustand for fast, scalable state management

## Tech Stack & Versions (Nov 2025)

### Frontend
| Technology            | Version      |
|-----------------------|--------------|
| React                 | 18.3.1       |
| TypeScript            | 5.5.4        |
| Vite                  | 5.4.8        |
| Tailwind CSS          | 3.4.14       |
| Socket.IO Client      | 4.8.1        |
| perfect-freehand      | 1.2.2        |
| rough.js              | 4.6.6        |
| lucide-react          | 0.483.0      |
| Zustand               | 5.0.0-rc.2   |

### Backend
| Technology            | Version      |
|-----------------------|--------------|
| Node.js               | 20.18.0      |
| Express               | 4.21.2       |
| Socket.IO             | 4.8.1        |
| MongoDB + Mongoose    | 8.12.2       |
| jsonwebtoken          | 9.0.2        |
| bcryptjs              | 3.0.2        |
| Joi                   | 17.13.3      |
| winston               | 3.17.0       |

## Project Structure

```bash
SketchSpace/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── canvasController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Canvas.js
│   │   └── User.js
│   ├── routes/
│   │   ├── canvasRoutes.js
│   │   └── users.js
│   ├── utils/
│   │   └── logger.js
│   ├── .gitignore
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Board/
│   │   │   ├── Toolbar/
│   │   │   ├── Toolbox/
│   │   │   └── colab/
│   │   ├── pages/
│   │   ├── store/
│   │   │   ├── BoardProvider.js
│   │   │   ├── ToolboxProvider.js
│   │   │   ├── board-context.js
│   │   │   └── toolbox-context.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   ├── element.js
│   │   │   └── math.js
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── constants.js
│   │   ├── index.css
│   │   └── index.js
│   ├── .gitignore
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   └── tailwind.config.js
│
├── .gitignore
└── README.md
```

## Installation

```bash
# Clone the repo (ayush branch)
git clone -b ayush https://github.com/AyushHurkat0022/SketchSpace.git
cd SketchSpace
```

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Add MONGODB_URI, JWT_SECRET
npm run dev
# → http://localhost:5000
```

### Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm run dev
# → http://localhost:3000
```

## Usage & Shortcuts

- `Ctrl+Z` → Undo  
- `Ctrl+Y` → Redo  
- `Space` + Drag → Pan  
- Scroll / Pinch → Zoom  
- Click toolbar → Change tool, color, size

## Contributing

We love contributions!  
1. Fork the repo  
2. Create your feature branch (`git checkout -b feature/amazing`)  
3. Commit your changes  
4. Push and open a Pull Request to the `ayush` branch

Please follow ESLint, Prettier, and TypeScript best practices.

## Contact

**Ayush Hurkat**  
[![Email](https://img.shields.io/badge/Email-ayushhurkat.22%40gmail.com-FF4B4B?style=for-the-badge&logo=gmail&logoColor=white)](mailto:ayushhurkat.22@gmail.com)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ayush%20Hurkat-0077FF?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ayushhurkat)

[![GitHub](https://img.shields.io/badge/GitHub-AyushHurkat0022-4CAF50?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AyushHurkat0022)

[![Project](https://img.shields.io/badge/SketchSpace-Repository-FFB800?style=for-the-badge&logo=react&logoColor=white)](https://github.com/AyushHurkat0022/SketchSpace)


---
Made with passion for real-time creativity.

**Like it? Star this repo! 🌟**

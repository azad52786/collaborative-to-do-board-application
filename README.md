# CollabBoard - Real-time Collaborative Todo Board with MongoDB

A modern, real-time collaborative todo board application with MongoDB, Docker, and user-specific access control.

## ✨ Features

### 🎯 Core Functionality
- **Kanban Board**: Drag-and-drop task management with three columns (Todo, In Progress, Done)
- **Real-time Collaboration**: Live updates using WebSocket technology
- **Smart Task Assignment**: Intelligent assignment based on workload
- **Activity Logging**: Live activity feed showing last 20 user actions
- **Conflict Resolution**: Detect and resolve editing conflicts

### 🎨 Design & UX
- **Modern UI**: Custom CSS with futuristic design and soft blue/purple tones
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Responsive Design**: Fully responsive for desktop, tablet, and mobile
- **Glass Morphism**: Modern glassmorphism effects and backdrop blur
- **Dark Theme**: Sleek dark theme optimized for developer workflows

### 🔐 Authentication
- **JWT-based Auth**: Secure authentication system
- **User Management**: Registration and login functionality
- **Protected Routes**: Route protection and user sessions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install frontend dependencies**
   ```bash
   npm install
   ```

2. **Install backend dependencies**
   ```bash
   npm run backend:install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   npm run backend
   ```

2. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
as1/
├── src/
│   ├── components/           # React components
│   │   ├── AuthPage.jsx     # Login/Registration page
│   │   ├── Dashboard.jsx    # Main dashboard with Kanban board
│   │   ├── TaskCard.jsx     # Individual task card component
│   │   ├── ActivityPanel.jsx # Live activity sidebar
│   │   ├── TaskModal.jsx    # Task creation/editing modal
│   │   ├── ConflictModal.jsx # Conflict resolution modal
│   │   └── Toast.jsx        # Notification toast component
│   ├── context/             # React context providers
│   │   ├── AuthContext.jsx  # Authentication context
│   │   └── SocketContext.jsx # WebSocket context
│   ├── styles/              # CSS files
│   │   └── globals.css      # Global styles and CSS variables
│   └── App.jsx              # Main app component
├── backend/                 # Node.js backend
│   ├── server.js           # Express server with Socket.IO
│   └── package.json        # Backend dependencies
└── README.md               # This file
```

## 🎨 Design System

### Color Palette
```css
--primary-bg: #0f0f23      /* Dark background */
--secondary-bg: #1a1a2e    /* Secondary background */
--card-bg: #16213e         /* Card backgrounds */
--accent-blue: #0f3460     /* Primary accent */
--accent-purple: #533483   /* Secondary accent */
--text-primary: #e94560    /* Primary text */
--text-secondary: #f5f5f5  /* Secondary text */
--success: #00d4aa         /* Success color */
--warning: #ffb347         /* Warning color */
--error: #ff6b6b           /* Error color */
```

## 🔧 Technology Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Smooth animations and transitions
- **React Beautiful DnD** - Drag and drop functionality
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.IO Client** - Real-time WebSocket communication
- **Lucide React** - Beautiful icon library
- **Custom CSS** - No UI frameworks, pure custom styling

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

## 📋 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run backend` - Start backend in development mode
- `npm run backend:install` - Install backend dependencies

## 🌟 Key Features

### 1. **Drag and Drop Kanban Board**
- Smooth drag animations with visual feedback
- Real-time updates across all connected clients
- Column highlighting during drag operations

### 2. **Smart Task Assignment**
- AI-powered assignment based on current workloads
- One-click assignment with visual feedback
- User avatar integration

### 3. **Real-time Collaboration**
- Live activity feed with timestamps
- Instant task updates across all users
- Connection status indicators

### 4. **Conflict Resolution**
- Automatic conflict detection
- Side-by-side comparison of changes
- Multiple resolution options

### 5. **Mobile-First Design**
- Touch-optimized interactions
- Responsive grid layouts
- Collapsible panels for mobile

**Built with ❤️ for modern collaborative workflows**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Toast from "./components/Toast";
import "./components/ProtectedRoute.css";

const PublicRoute = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="loading-container">
				<motion.div
					className="loading-spinner"
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
				>
					<div className="spinner-ring"></div>
				</motion.div>
				<p>Loading...</p>
			</div>
		);
	}

	// Redirect to dashboard if already authenticated
	return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppContent() {
	const [toasts, setToasts] = useState([]);

	const addToast = (message, type = "info") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((toast) => toast.id !== id));
		}, 5000);
	};

	return (
		<div className="app">
			<AnimatePresence mode="wait">
				<Routes>
					<Route
						path="/auth"
						element={
							<PublicRoute>
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.3 }}
								>
									<AuthPage addToast={addToast} />
								</motion.div>
							</PublicRoute>
						}
					/>
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<SocketProvider>
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										transition={{ duration: 0.3 }}
									>
										<Dashboard addToast={addToast} />
									</motion.div>
								</SocketProvider>
							</ProtectedRoute>
						}
					/>
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
				</Routes>
			</AnimatePresence>

			{/* Toast Notifications */}
			<div className="toast-container">
				<AnimatePresence>
					{toasts.map((toast) => (
						<Toast key={toast.id} {...toast} />
					))}
				</AnimatePresence>
			</div>
		</div>
	);
}

function App() {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	);
}

export default App;

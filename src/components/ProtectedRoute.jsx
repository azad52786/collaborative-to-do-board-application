import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const ProtectedRoute = ({ children, requiredPermission }) => {
	const { user, loading, isAuthenticated, hasPermission } = useAuth();
	const location = useLocation();

	// Show loading spinner while checking authentication
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
				<p>Verifying authentication...</p>
			</div>
		);
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/auth" state={{ from: location }} replace />;
	}

	// Check for specific permission if required
	if (requiredPermission && !hasPermission(requiredPermission)) {
		return (
			<div className="unauthorized-container">
				<motion.div
					className="unauthorized-message"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h2>Access Denied</h2>
					<p>You don't have permission to access this resource.</p>
					<p>
						Current user: {user?.name} ({user?.email})
					</p>
					<p>Required permission: {requiredPermission}</p>
				</motion.div>
			</div>
		);
	}

	// Render protected content
	return children;
};

export default ProtectedRoute;

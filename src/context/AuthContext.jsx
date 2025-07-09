import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import axios from "axios";

const AuthContext = createContext();

// API Base URL
const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Set up axios interceptors for token handling
	useEffect(() => {
		// Request interceptor to add token to requests
		const requestInterceptor = axios.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem("token");
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);

		// Response interceptor to handle token expiration
		const responseInterceptor = axios.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response?.status === 401 || error.response?.status === 403) {
					// Token is invalid or expired
					logout();
				}
				return Promise.reject(error);
			}
		);

		// Cleanup interceptors on unmount
		return () => {
			axios.interceptors.request.eject(requestInterceptor);
			axios.interceptors.response.eject(responseInterceptor);
		};
	}, []);

	// Check for existing token and validate it
	useEffect(() => {
		const initializeAuth = async () => {
			const token = localStorage.getItem("token");
			if (token) {
				try {
					// Verify token by making a request to protected route
					const response = await axios.get("/tasks");
					if (response.status === 200) {
						// Token is valid, decode user info from token
						const userInfo = decodeToken(token);
						if (userInfo) {
							setUser(userInfo);
						}
					}
				} catch (error) {
					// Token is invalid, remove it
					localStorage.removeItem("token");
					setError("Session expired. Please login again.");
				}
			}
			setLoading(false);
		};

		initializeAuth();
	}, []);

	// Helper function to decode JWT token
	const decodeToken = (token) => {
		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			const currentTime = Date.now() / 1000;

			// Check if token is expired
			if (payload.exp && payload.exp < currentTime) {
				return null;
			}

			return {
				id: payload.id,
				email: payload.email,
				name: payload.name || payload.email.split("@")[0],
				avatar: payload.avatar || payload.email.slice(0, 2).toUpperCase(),
			};
		} catch (error) {
			console.error("Error decoding token:", error);
			return null;
		}
	};

	const login = async (email, password) => {
		try {
			// setLoading(true);
			setError(null);

			// Validate input
			if (!email || !password) {
				throw new Error("Email and password are required");
			}

			// Email validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Please enter a valid email address");
			}

			// Make API call
			const response = await axios.post("/auth/login", {
				email: email.toLowerCase().trim(),
				password,
			});

			if (response.data.token && response.data.user) {
				// Store token
				localStorage.setItem("token", response.data.token);

				// Set user
				setUser(response.data.user);

				return { success: true, message: "Login successful" };
			} else {
				throw new Error("Invalid response from server");
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.error || error.message || "Login failed";
			setError(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setLoading(false);
		}
	};

	const register = async (name, email, password, confirmPassword) => {
		try {
			setLoading(true);
			setError(null);

			// Validate input
			if (!name || !email || !password || !confirmPassword) {
				throw new Error("All fields are required");
			}

			// Name validation
			if (name.trim().length < 2) {
				throw new Error("Name must be at least 2 characters long");
			}

			// Email validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Please enter a valid email address");
			}

			// Password validation
			if (password.length < 6) {
				throw new Error("Password must be at least 6 characters long");
			}

			// Password confirmation
			if (password !== confirmPassword) {
				throw new Error("Passwords do not match");
			}

			// Make API call
			const response = await axios.post("/auth/register", {
				name: name.trim(),
				email: email.toLowerCase().trim(),
				password,
			});

			if (response.data.token && response.data.user) {
				// Store token
				localStorage.setItem("token", response.data.token);

				// Set user
				setUser(response.data.user);

				return { success: true, message: "Registration successful" };
			} else {
				throw new Error("Invalid response from server");
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.error || error.message || "Registration failed";
			setError(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		// Clear token and user data
		localStorage.removeItem("token");
		setUser(null);
		setError(null);
	};

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Check if user is authenticated
	const isAuthenticated = !!user;

	// Check if user has specific permission (for future role-based access)
	const hasPermission = (permission) => {
		if (!user) return false;
		// For now, all authenticated users have all permissions
		// This can be extended with role-based logic
		return true;
	};

	const value = {
		user,
		loading,
		error,
		isAuthenticated,
		login,
		register,
		logout,
		clearError,
		hasPermission,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	User,
	Mail,
	Lock,
	Eye,
	EyeOff,
	AlertCircle,
	CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

const AuthPage = ({ addToast }) => {
	const [isLogin, setIsLogin] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const { login, register, error, clearError } = useAuth();

	// Clear errors when switching between login/register
	useEffect(() => {
		setValidationErrors({});
		clearError();
		setFormData({
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		});
	}, [isLogin, clearError]);

	// Validation functions
	const validateName = (name) => {
		if (!name.trim()) return "Name is required";
		if (name.trim().length < 2) return "Name must be at least 2 characters";
		return null;
	};

	const validateEmail = (email) => {
		if (!email) return "Email is required";
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return "Please enter a valid email address";
		return null;
	};

	const validatePassword = (password) => {
		if (!password) return "Password is required";
		if (password.length < 6) return "Password must be at least 6 characters";

		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);

		if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
			return "Password must contain uppercase, lowercase, and numbers";
		}
		return null;
	};

	const validateConfirmPassword = (password, confirmPassword) => {
		if (!confirmPassword) return "Please confirm your password";
		if (password !== confirmPassword) return "Passwords do not match";
		return null;
	};

	// Real-time validation
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear specific field error when user starts typing
		if (validationErrors[name]) {
			setValidationErrors((prev) => ({
				...prev,
				[name]: null,
			}));
		}

		// Clear global error
		if (error) {
			clearError();
		}
	};

	// Validate form on blur
	const handleInputBlur = (e) => {
		const { name, value } = e.target;
		let fieldError = null;

		switch (name) {
			case "name":
				if (!isLogin) fieldError = validateName(value);
				break;
			case "email":
				fieldError = validateEmail(value);
				break;
			case "password":
				fieldError = validatePassword(value);
				break;
			case "confirmPassword":
				if (!isLogin)
					fieldError = validateConfirmPassword(formData.password, value);
				break;
			default:
				break;
		}

		if (fieldError) {
			setValidationErrors((prev) => ({
				...prev,
				[name]: fieldError,
			}));
		}
	};

	const validateForm = () => {
		const errors = {};

		if (!isLogin) {
			const nameError = validateName(formData.name);
			if (nameError) errors.name = nameError;
		}

		const emailError = validateEmail(formData.email);
		if (emailError) errors.email = emailError;

		const passwordError = validatePassword(formData.password);
		if (passwordError) errors.password = passwordError;

		if (!isLogin) {
			const confirmPasswordError = validateConfirmPassword(
				formData.password,
				formData.confirmPassword
			);
			if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
		}
		console.log(errors);

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Prevent double submission
		if (loading) return;

		if (!validateForm()) {
			// Validation errors are already displayed inline, no need for toast
			return;
		}

		setLoading(true);
		clearError(); // Clear any previous errors

		try {
			let result;
			if (isLogin) {
				result = await login(formData.email, formData.password);
			} else {
				result = await register(
					formData.name,
					formData.email,
					formData.password,
					formData.confirmPassword
				);
			}

			if (result.success) {
				addToast(
					result.message || `${isLogin ? "Login" : "Registration"} successful!`,
					"success"
				);
				// Form will be unmounted after successful auth, so no need to setLoading(false)
			} else {
				// Show error but keep form accessible
				addToast(result.error || "Something went wrong", "error");
			}
		} catch (err) {
			console.error("Auth error:", err);
			addToast("Network error. Please try again.", "error");
		} finally {
			setLoading(false);
		}
	};

	const getFieldError = (fieldName) => {
		return validationErrors[fieldName] || null;
	};

	const hasError = (fieldName) => {
		return !!getFieldError(fieldName);
	};

	// Demo user login function
	const handleDemoLogin = async (email, password) => {
		if (loading) return;

		setLoading(true);
		clearError();

		try {
			const result = await login(email, password);
			if (result.success) {
				addToast(`Demo login successful! Welcome!`, "success");
			} else {
				addToast(result.error || "Demo login failed", "error");
			}
		} catch (err) {
			console.error("Demo login error:", err);
			addToast("Demo login failed. Please try again.", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-background">
				<div className="floating-elements">
					{[...Array(6)].map((_, i) => (
						<motion.div
							key={i}
							className="floating-element"
							animate={{
								y: [0, -20, 0],
								rotate: [0, 360],
								opacity: [0.3, 0.7, 0.3],
							}}
							transition={{
								duration: 4 + i,
								repeat: Infinity,
								delay: i * 0.5,
							}}
						/>
					))}
				</div>
			</div>

			<div className="auth-container">
				<motion.div
					className="auth-card glass"
					initial={{ opacity: 0, scale: 0.9, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				>
					<div className="auth-header">
						<motion.h1
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.5 }}
						>
							{isLogin ? "Welcome Back" : "Join Us"}
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.5 }}
							className="text-muted"
						>
							{isLogin
								? "Sign in to your collaborative workspace"
								: "Create your account to get started"}
						</motion.p>

						{/* Demo User Login Buttons */}
						<motion.div
							className="demo-view"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.4, duration: 0.3 }}
						>
							<div className="demo-header">
								<h3>Demo View</h3>
								<p className="text-muted">Quick login with demo accounts</p>
							</div>
							<div className="demo-buttons">
								<motion.button
									type="button"
									className="demo-btn demo-student"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() =>
										handleDemoLogin("alice.johnson@example.com", "Password123")
									}
									disabled={loading}
								>
									Log In Demo User1
								</motion.button>
								<motion.button
									type="button"
									className="demo-btn demo-teacher"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() =>
										handleDemoLogin("bob@example.com", "Password123")
									}
									disabled={loading}
								>
									Log In Demo User2
								</motion.button>
							</div>
						</motion.div>
					</div>

					<motion.form
						className="auth-form"
						onSubmit={handleSubmit}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4, duration: 0.5 }}
					>
						{!isLogin && (
							<motion.div
								className="form-group"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.5, duration: 0.3 }}
							>
								<label htmlFor="name">Full Name</label>
								<div
									className={`input-wrapper ${hasError("name") ? "error" : ""}`}
								>
									<User className="input-icon" size={18} />
									<input
										type="text"
										id="name"
										name="name"
										className="input"
										placeholder="Enter your full name"
										value={formData.name}
										onChange={handleInputChange}
										onBlur={handleInputBlur}
										required={!isLogin}
									/>
									{!hasError("name") &&
										formData.name &&
										formData.name.length >= 2 && (
											<CheckCircle className="success-icon" size={16} />
										)}
								</div>
								{hasError("name") && (
									<span className="field-error">
										<AlertCircle size={14} />
										{getFieldError("name")}
									</span>
								)}
							</motion.div>
						)}

						<motion.div
							className="form-group"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: isLogin ? 0.5 : 0.6, duration: 0.3 }}
						>
							<label htmlFor="email">Email Address</label>
							<div
								className={`input-wrapper ${hasError("email") ? "error" : ""}`}
							>
								<Mail className="input-icon" size={18} />
								<input
									type="email"
									id="email"
									name="email"
									className="input"
									placeholder="Enter your email"
									value={formData.email}
									onChange={handleInputChange}
									onBlur={handleInputBlur}
									required
								/>
								{!hasError("email") &&
									formData.email &&
									/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
										<CheckCircle className="success-icon" size={16} />
									)}
							</div>
							{hasError("email") && (
								<span className="field-error">
									<AlertCircle size={14} />
									{getFieldError("email")}
								</span>
							)}
						</motion.div>

						<motion.div
							className="form-group"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: isLogin ? 0.6 : 0.7, duration: 0.3 }}
						>
							<label htmlFor="password">Password</label>
							<div
								className={`input-wrapper ${
									hasError("password") ? "error" : ""
								}`}
							>
								<Lock className="input-icon" size={18} />
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									name="password"
									className="input"
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleInputChange}
									onBlur={handleInputBlur}
									required
								/>
								<button
									type="button"
									className="password-toggle"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
								{!hasError("password") &&
									formData.password &&
									formData.password.length >= 6 && (
										<CheckCircle className="success-icon" size={16} />
									)}
							</div>
							{hasError("password") && (
								<span className="field-error">
									<AlertCircle size={14} />
									{getFieldError("password")}
								</span>
							)}
							{!isLogin && formData.password && (
								<div className="password-strength">
									<div className="strength-indicators">
										<span
											className={
												formData.password.length >= 6 ? "valid" : "invalid"
											}
										>
											6+ characters
										</span>
										<span
											className={
												/[A-Z]/.test(formData.password) ? "valid" : "invalid"
											}
										>
											Uppercase
										</span>
										<span
											className={
												/[a-z]/.test(formData.password) ? "valid" : "invalid"
											}
										>
											Lowercase
										</span>
										<span
											className={
												/\d/.test(formData.password) ? "valid" : "invalid"
											}
										>
											Number
										</span>
									</div>
								</div>
							)}
						</motion.div>

						{!isLogin && (
							<motion.div
								className="form-group"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.8, duration: 0.3 }}
							>
								<label htmlFor="confirmPassword">Confirm Password</label>
								<div
									className={`input-wrapper ${
										hasError("confirmPassword") ? "error" : ""
									}`}
								>
									<Lock className="input-icon" size={18} />
									<input
										type={showConfirmPassword ? "text" : "password"}
										id="confirmPassword"
										name="confirmPassword"
										className="input"
										placeholder="Confirm your password"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										onBlur={handleInputBlur}
										required={!isLogin}
									/>
									<button
										type="button"
										className="password-toggle"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									>
										{showConfirmPassword ? (
											<EyeOff size={18} />
										) : (
											<Eye size={18} />
										)}
									</button>
									{!hasError("confirmPassword") &&
										formData.confirmPassword &&
										formData.password === formData.confirmPassword && (
											<CheckCircle className="success-icon" size={16} />
										)}
								</div>
								{hasError("confirmPassword") && (
									<span className="field-error">
										<AlertCircle size={14} />
										{getFieldError("confirmPassword")}
									</span>
								)}
							</motion.div>
						)}

						<motion.button
							type="submit"
							className={`btn btn-primary auth-submit ${
								loading ? "loading" : ""
							}`}
							disabled={loading}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: isLogin ? 0.7 : 0.8, duration: 0.3 }}
							whileHover={!loading ? { scale: 1.02 } : {}}
							whileTap={!loading ? { scale: 0.98 } : {}}
						>
							{loading ? (
								<>
									<div className="button-spinner" />
									<span>
										{isLogin ? "Signing In..." : "Creating Account..."}
									</span>
								</>
							) : (
								<span>{isLogin ? "Sign In" : "Create Account"}</span>
							)}
						</motion.button>
					</motion.form>

					<motion.div
						className="auth-switch"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: isLogin ? 0.8 : 0.9, duration: 0.3 }}
					>
						<p className="text-muted">
							{isLogin ? "Don't have an account?" : "Already have an account?"}
							<button
								type="button"
								className="switch-btn"
								onClick={() => {
									setIsLogin(!isLogin);
									setFormData({ name: "", email: "", password: "" });
								}}
							>
								{isLogin ? "Sign up" : "Sign in"}
							</button>
						</p>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
};

export default AuthPage;

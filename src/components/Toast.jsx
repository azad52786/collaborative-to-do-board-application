import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import "./Toast.css";

const Toast = ({ id, message, type = "info", onClose }) => {
	const getIcon = () => {
		switch (type) {
			case "success":
				return <CheckCircle size={20} />;
			case "error":
				return <AlertCircle size={20} />;
			case "warning":
				return <AlertCircle size={20} />;
			default:
				return <Info size={20} />;
		}
	};

	return (
		<motion.div
			className={`toast toast-${type}`}
			initial={{ opacity: 0, x: 300, scale: 0.8 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 300, scale: 0.8 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			layout
		>
			<div className="toast-icon">{getIcon()}</div>

			<div className="toast-content">
				<p className="toast-message">{message}</p>
			</div>

			<button className="toast-close" onClick={() => onClose && onClose(id)}>
				<X size={16} />
			</button>
		</motion.div>
	);
};

export default Toast;

import { motion } from "framer-motion";
import { AlertTriangle, X, User, Clock } from "lucide-react";
import "./ConflictModal.css";

const ConflictModal = ({ conflictData, onClose, onResolve }) => {
	if (!conflictData) return null;

	const { task, localVersion, remoteVersion, user } = conflictData;

	const handleResolve = (resolution) => {
		onResolve(resolution);
	};

	return (
		<motion.div
			className="modal-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			<motion.div
				className="modal-content conflict-modal"
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ duration: 0.3 }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header conflict-header">
					<div className="conflict-title">
						<AlertTriangle size={24} className="warning-icon" />
						<h2>Conflict Detected</h2>
					</div>
					<button className="modal-close" onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className="conflict-content">
					<div className="conflict-message">
						<p>
							<strong>{user}</strong> has modified the task "
							<strong>{task}</strong>" while you were editing it. Please choose
							how to resolve this conflict:
						</p>
					</div>

					<div className="conflict-versions">
						<div className="version-card local">
							<div className="version-header">
								<User size={16} />
								<h3>Your Version</h3>
								<span className="version-label">Local</span>
							</div>
							<div className="version-content">
								<div className="field">
									<label>Title:</label>
									<span>{localVersion.title}</span>
								</div>
								<div className="field">
									<label>Description:</label>
									<span>{localVersion.description}</span>
								</div>
								<div className="field">
									<label>Priority:</label>
									<span className={`priority ${localVersion.priority}`}>
										{localVersion.priority}
									</span>
								</div>
								<div className="field">
									<label>Modified:</label>
									<div className="timestamp">
										<Clock size={14} />
										<span>
											{new Date(localVersion.lastModified).toLocaleString()}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="version-card remote">
							<div className="version-header">
								<User size={16} />
								<h3>{user}'s Version</h3>
								<span className="version-label">Remote</span>
							</div>
							<div className="version-content">
								<div className="field">
									<label>Title:</label>
									<span>{remoteVersion.title}</span>
								</div>
								<div className="field">
									<label>Description:</label>
									<span>{remoteVersion.description}</span>
								</div>
								<div className="field">
									<label>Priority:</label>
									<span className={`priority ${remoteVersion.priority}`}>
										{remoteVersion.priority}
									</span>
								</div>
								<div className="field">
									<label>Modified:</label>
									<div className="timestamp">
										<Clock size={14} />
										<span>
											{new Date(remoteVersion.lastModified).toLocaleString()}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="conflict-actions">
						<button
							className="btn btn-secondary"
							onClick={() => handleResolve("keep-local")}
						>
							Keep My Version
						</button>
						<button
							className="btn btn-warning"
							onClick={() => handleResolve("keep-remote")}
						>
							Accept {user}'s Version
						</button>
						<button
							className="btn btn-primary"
							onClick={() => handleResolve("merge")}
						>
							Merge Changes
						</button>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default ConflictModal;

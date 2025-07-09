import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, ArrowRight, Plus, Edit3 } from "lucide-react";
import "./ActivityPanel.css";

const ActivityPanel = ({ activities }) => {
	const getActivityIcon = (action) => {
		switch (action) {
			case "created":
				return <Plus size={14} />;
			case "updated":
				return <Edit3 size={14} />;
			case "moved":
				return <ArrowRight size={14} />;
			default:
				return <User size={14} />;
		}
	};

	const getTimeAgo = (timestamp) => {
		const now = new Date();
		const time = new Date(timestamp);
		const diffInMinutes = Math.floor((now - time) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		return `${diffInDays}d ago`;
	};

	const formatActivity = (activity) => {
		const taskName = activity.taskTitle || activity.task || "a task";
		switch (activity.action) {
			case "created":
				return `created "${taskName}"`;
			case "updated":
				return `updated "${taskName}"`;
			case "moved":
				return `moved "${taskName}" from ${
					activity.details?.from || activity.from
				} to ${activity.details?.to || activity.to}`;
			default:
				return `performed an action on "${taskName}"`;
		}
	};

	return (
		<div className="activity-panel">
			<div className="activity-list">
				<AnimatePresence>
					{activities.length === 0 ? (
						<motion.div
							className="empty-state"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<Clock size={32} />
							<p>No recent activity</p>
						</motion.div>
					) : (
						activities.map((activity, index) => (
							<motion.div
								key={activity.id}
								className="activity-item"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ delay: index * 0.05, duration: 0.3 }}
								layout
							>
								<div className="activity-icon">
									{getActivityIcon(activity.action)}
								</div>

								<div className="activity-content">
									<div className="activity-text">
										<span className="user-name">
											{activity.userDetails?.name ||
												activity.user?.name ||
												activity.user ||
												"Someone"}
										</span>
										<span className="activity-description">
											{formatActivity(activity)}
										</span>
									</div>

									<div className="activity-time">
										<Clock size={12} />
										<span>{getTimeAgo(activity.timestamp)}</span>
									</div>
								</div>
							</motion.div>
						))
					)}
				</AnimatePresence>
			</div>

			<div className="activity-footer">
				<button className="btn btn-secondary btn-small">
					View All Activity
				</button>
			</div>
		</div>
	);
};

export default ActivityPanel;

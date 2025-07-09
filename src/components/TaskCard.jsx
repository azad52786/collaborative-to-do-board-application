import { motion } from "framer-motion";
import { Zap, Clock, User, MoreHorizontal } from "lucide-react";
import "./TaskCard.css";

const TaskCard = ({
	task,
	onSmartAssign,
	onClick,
	isDragging,
	className = "",
}) => {
	const getPriorityColor = (priority) => {
		switch (priority) {
			case "high":
				return "#ff6b6b";
			case "medium":
				return "#ffb347";
			case "low":
				return "#00d4aa";
			default:
				return "#a0a0a0";
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	// Use regular div when dragging to avoid conflicts
	const CardComponent = isDragging ? "div" : motion.div;
	const cardProps = isDragging
		? {
				className: `task-card ${className}`,
				"data-task-id": task._id || task.id,
		  }
		: {
				className: `task-card ${className}`,
				"data-task-id": task._id || task.id,
				whileHover: { y: -2, scale: 1.02 },
				whileTap: { scale: 0.98 },
				transition: { duration: 0.2 },
		  };

	return (
		<CardComponent {...cardProps} onClick={onClick}>
			<div className="task-header">
				<div
					className="task-priority"
					style={{ backgroundColor: getPriorityColor(task.priority) }}
				>
					{task.priority}
				</div>
				<button
					className="task-menu"
					onClick={(e) => {
						e.stopPropagation();
						// Handle menu click
					}}
				>
					<MoreHorizontal size={14} />
				</button>
			</div>

			<div className="task-content">
				<h4 className="task-title">{task.title}</h4>
				<p className="task-description">{task.description}</p>
			</div>

			<div className="task-footer">
				<div className="task-meta">
					<div className="assigned-user">
						{task.assignedTo ? (
							<>
								<div className="user-avatar small">
									{task.assignedTo.avatar}
								</div>
								<span className="user-name">{task.assignedTo.name}</span>
							</>
						) : (
							<div className="unassigned">
								<User size={14} />
								<span>Unassigned</span>
							</div>
						)}
					</div>

					<div className="task-date">
						<Clock size={12} />
						<span>{formatDate(task.createdAt)}</span>
					</div>
				</div>

				<motion.button
					className="smart-assign-btn"
					onClick={(e) => {
						e.stopPropagation();
						onSmartAssign();
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
					title="Smart Assign"
				>
					<Zap size={14} />
				</motion.button>
			</div>
		</CardComponent>
	);
};

export default TaskCard;

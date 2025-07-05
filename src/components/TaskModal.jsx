import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, User, Calendar, Flag } from "lucide-react";
import "./TaskModal.css";

const TaskModal = ({ task, onClose, onSave }) => {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: null,
	});

	useEffect(() => {
		if (task) {
			setFormData({
				title: task.title || "",
				description: task.description || "",
				priority: task.priority || "medium",
				assignedTo: task.assignedTo || null,
			});
		}
	}, [task]);

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(formData);
		onClose();
	};

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const users = [
		{ name: "John Doe", avatar: "JD" },
		{ name: "Jane Smith", avatar: "JS" },
		{ name: "Bob Wilson", avatar: "BW" },
		{ name: "Alice Brown", avatar: "AB" },
	];

	return (
		<motion.div
			className="modal-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			<motion.div
				className="modal-content task-modal"
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				transition={{ duration: 0.3 }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>{task ? "Edit Task" : "Create New Task"}</h2>
					<button className="modal-close" onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form className="task-form" onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="title">Task Title</label>
						<input
							type="text"
							id="title"
							name="title"
							className="input"
							placeholder="Enter task title"
							value={formData.title}
							onChange={handleInputChange}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="description">Description</label>
						<textarea
							id="description"
							name="description"
							className="input textarea"
							placeholder="Enter task description"
							rows="4"
							value={formData.description}
							onChange={handleInputChange}
						/>
					</div>

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="priority">
								<Flag size={16} />
								Priority
							</label>
							<select
								id="priority"
								name="priority"
								className="input select"
								value={formData.priority}
								onChange={handleInputChange}
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>

						<div className="form-group">
							<label>
								<User size={16} />
								Assign To
							</label>
							<div className="user-select">
								{users.map((user) => (
									<button
										key={user.name}
										type="button"
										className={`user-option ${
											formData.assignedTo?.name === user.name ? "selected" : ""
										}`}
										onClick={() =>
											setFormData({ ...formData, assignedTo: user })
										}
									>
										<div className="user-avatar small">{user.avatar}</div>
										<span>{user.name}</span>
									</button>
								))}
								<button
									type="button"
									className={`user-option ${
										!formData.assignedTo ? "selected" : ""
									}`}
									onClick={() => setFormData({ ...formData, assignedTo: null })}
								>
									<div className="user-avatar small unassigned">
										<User size={12} />
									</div>
									<span>Unassigned</span>
								</button>
							</div>
						</div>
					</div>

					<div className="modal-actions">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={onClose}
						>
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							{task ? "Update Task" : "Create Task"}
						</button>
					</div>
				</form>
			</motion.div>
		</motion.div>
	);
};

export default TaskModal;

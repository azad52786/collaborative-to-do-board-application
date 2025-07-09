import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, User, Calendar, Flag } from "lucide-react";
import "./TaskModal.css";

const API_BASE_URL = "http://localhost:3001/api";

const TaskModal = ({ task, onClose, onSave }) => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: null,
	});

	// Fetch users from API
	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const token = localStorage.getItem("token");
				const response = await fetch(`${API_BASE_URL}/users`, {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					const data = await response.json();
					console.log(data);
					setUsers(data.users || []);
				} else {
					console.error("Failed to fetch users");
				}
			} catch (error) {
				console.error("Error fetching users:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, []);

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

		// Prepare data for API - send user ID instead of full user object
		const submitData = {
			...formData,
			assignedTo: formData.assignedTo?._id || null,
		};

		onSave(submitData);
		onClose();
	};

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	// Filter users based on search query
	const filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
								{loading ? (
									<div className="loading-users">Loading users...</div>
								) : (
									<>
										<input
											type="text"
											className="input search-input"
											placeholder="Search users by name or email..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
										<div className="user-list-container">
											{filteredUsers.length > 0 ? (
												filteredUsers.map((user) => (
													<button
														key={user._id}
														type="button"
														className={`user-option ${
															formData.assignedTo?._id === user._id
																? "selected"
																: ""
														}`}
														onClick={() =>
															setFormData({ ...formData, assignedTo: user })
														}
													>
														<div className="user-avatar small">
															{user.avatar}
														</div>
														<div className="user-info">
															<span className="user-name">{user.name}</span>
															<span className="user-email">{user.email}</span>
														</div>
													</button>
												))
											) : (
												<div className="no-users-found">
													{searchQuery
														? "No users found matching your search"
														: "No users available"}
												</div>
											)}
											<button
												type="button"
												className={`user-option unassigned-option ${
													!formData.assignedTo ? "selected" : ""
												}`}
												onClick={() =>
													setFormData({ ...formData, assignedTo: null })
												}
											>
												<div className="user-avatar small unassigned">
													<User size={12} />
												</div>
												<div className="user-info">
													<span className="user-name">Unassigned</span>
													<span className="user-email">No assignee</span>
												</div>
											</button>
										</div>
									</>
								)}
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

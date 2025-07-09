import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	closestCorners,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, LogOut, User, Bell, Settings, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import TaskCard from "./TaskCard";
import SortableTaskCard from "./SortableTaskCard";
import DroppableColumn from "./DroppableColumn";
import ActivityPanel from "./ActivityPanel";
import TaskModal from "./TaskModal";
import ConflictModal from "./ConflictModal";
import "./Dashboard.css";

const API_BASE_URL = "http://localhost:3001/api";

const Dashboard = ({ addToast }) => {
	const { user, logout } = useAuth();
	const { socket, isConnected } = useSocket();

	// Get token from localStorage
	const token = localStorage.getItem("token");

	const [tasks, setTasks] = useState({
		todo: [],
		inProgress: [],
		done: [],
	});

	const [activities, setActivities] = useState([]);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	const [showTaskModal, setShowTaskModal] = useState(false);
	const [showConflictModal, setShowConflictModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [conflictData, setConflictData] = useState(null);
	const [activeTask, setActiveTask] = useState(null);
	const [dragState, setDragState] = useState({
		isDragging: false,
		draggedTask: null,
		originalPosition: null,
		isRollingBack: false,
	});
	const [movingTaskId, setMovingTaskId] = useState(null);
	const [dragPath, setDragPath] = useState({ from: null, to: null });

	// Helper function to check if there are any tasks
	const hasAnyTasks = () => {
		return (
			tasks.todo.length > 0 ||
			tasks.inProgress.length > 0 ||
			tasks.done.length > 0
		);
	};

	const columns = [
		{ id: "todo", title: "Todo", color: "#0f3460" },
		{ id: "inProgress", title: "In Progress", color: "#533483" },
		{ id: "done", title: "Done", color: "#00d4aa" },
	];

	// API Helper Functions
	const apiCall = useCallback(
		async (endpoint, options = {}) => {
			try {
				const response = await fetch(`${API_BASE_URL}${endpoint}`, {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
						...options.headers,
					},
					...options,
				});

				if (!response.ok) {
					throw new Error(`API Error: ${response.status}`);
				}

				return await response.json();
			} catch (error) {
				console.error("API call failed:", error);
				throw error;
			}
		},
		[token]
	);

	const fetchTasks = useCallback(async () => {
		try {
			const data = await apiCall("/tasks");
			setTasks(data);
		} catch (error) {
			console.error("Failed to fetch tasks:", error);
			addToast("Failed to refresh tasks", "error");
		}
	}, [apiCall, addToast]);

	const fetchActivities = useCallback(async () => {
		try {
			const data = await apiCall("/activities");
			setActivities(data);
		} catch (error) {
			console.error("Failed to fetch activities:", error);
		}
	}, [apiCall]);

	// Load initial data
	useEffect(() => {
		const loadData = async () => {
			if (!token) {
				setLoading(false);
				return;
			}

			setLoading(true);
			console.log("Fetching Data from DB!!!");

			try {
				// Direct API calls to avoid dependency issues
				const fetchWithAuth = async (endpoint) => {
					const response = await fetch(`${API_BASE_URL}${endpoint}`, {
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
					});

					if (!response.ok) {
						throw new Error(`API Error: ${response.status}`);
					}

					return await response.json();
				};

				// Fetch tasks
				const tasksData = await fetchWithAuth("/tasks");
				setTasks(tasksData);

				// Fetch activities
				const activitiesData = await fetchWithAuth("/activities");
				setActivities(activitiesData);

				// Fetch users
				const usersData = await fetchWithAuth("/users");
				setUsers(usersData.users || []);

				console.log("Data loaded successfully!");
			} catch (error) {
				console.error("Failed to load initial data:", error);
				// Handle error without addToast dependency
				console.log("Please refresh the page if data doesn't load");
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [token]); // Only depend on token

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragStart = (event) => {
		const { active } = event;
		const activeContainer = findContainer(active.id);
		if (activeContainer) {
			const task = tasks[activeContainer].find(
				(task) => (task._id || task.id) === active.id
			);
			setActiveTask(task);
			setDragPath({ from: activeContainer, to: null });
			setDragState((prev) => ({
				...prev,
				isDragging: true,
				draggedTask: task,
				originalPosition: { container: activeContainer, task },
			}));

			// Add visual feedback
			const taskElement = document.querySelector(
				`[data-task-id="${active.id}"]`
			);
			if (taskElement) {
				taskElement.classList.add("dragging");
			}
		}
	};

	const findContainer = (id) => {
		if (columns.some((col) => col.id === id)) {
			return id;
		}

		// Find which column contains this task
		for (const [columnId, columnTasks] of Object.entries(tasks)) {
			if (columnTasks.find((task) => (task._id || task.id) === id)) {
				return columnId;
			}
		}
		return null;
	};

	const handleDragEnd = async (event) => {
		const { active, over } = event;

		if (!over) {
			setActiveTask(null);
			setDragState((prev) => ({
				...prev,
				isDragging: false,
				draggedTask: null,
			}));
			return;
		}

		const activeId = active.id;
		const overId = over.id;

		// Find the containers
		const activeContainer = findContainer(activeId);
		const overContainer = findContainer(overId);

		if (!activeContainer || !overContainer) {
			setActiveTask(null);
			setDragState((prev) => ({
				...prev,
				isDragging: false,
				draggedTask: null,
			}));
			return;
		}

		// Find the active task
		const activeTask = tasks[activeContainer].find(
			(task) => (task._id || task.id) === activeId
		);
		if (!activeTask) {
			setActiveTask(null);
			setDragState((prev) => ({
				...prev,
				isDragging: false,
				draggedTask: null,
			}));
			return;
		}

		if (activeContainer !== overContainer) {
			// Moving between different columns - use optimistic update
			await performOptimisticUpdate(
				activeId,
				activeContainer,
				overContainer,
				activeTask
			);
		} else {
			// Reordering within the same column - just update UI locally
			setTasks((prev) => {
				const items = prev[activeContainer];
				const activeIndex = items.findIndex(
					(item) => (item._id || item.id) === activeId
				);
				const overIndex = items.findIndex(
					(item) => (item._id || item.id) === overId
				);

				if (activeIndex !== overIndex) {
					const newItems = arrayMove(items, activeIndex, overIndex);
					return {
						...prev,
						[activeContainer]: newItems,
					};
				}

				return prev;
			});
		}

		// Clear the active task state
		setActiveTask(null);
		setDragState((prev) => ({ ...prev, isDragging: false, draggedTask: null }));
	};

	const handleSmartAssign = async (taskId) => {
		try {
			// Use real users from the API
			if (users.length === 0) {
				addToast("No users available for assignment", "warning");
				return;
			}

			// Simple assignment logic - assign to first available user
			const bestUser = users[0];

			// Update task assignment
			const response = await apiCall(`/tasks/${taskId}`, {
				method: "PUT",
				body: JSON.stringify({ assignedTo: bestUser._id }),
			});

			if (response.success) {
				// Refresh tasks to get the latest data
				await fetchTasks();
				await fetchActivities();
				addToast(`Smart assigned to ${bestUser.name}`, "success");
			}
		} catch (error) {
			console.error("Failed to assign task:", error);
			addToast("Failed to assign task", "error");
		}
	};

	const handleCreateTask = async (taskData) => {
		try {
			const response = await apiCall("/tasks", {
				method: "POST",
				body: JSON.stringify(taskData),
			});

			if (response.success) {
				// Refresh tasks to get the latest data
				await fetchTasks();
				await fetchActivities();
				addToast(`Created new task: ${response.task.title}`, "success");
			}
		} catch (error) {
			console.error("Failed to create task:", error);
			addToast("Failed to create task", "error");
		}
	};

	const handleUpdateTask = async (taskData) => {
		try {
			if (!selectedTask?._id) {
				addToast("No task selected for update", "error");
				return;
			}

			const response = await apiCall(`/tasks/${selectedTask._id}`, {
				method: "PUT",
				body: JSON.stringify(taskData),
			});

			if (response.success) {
				// Refresh tasks to get the latest data
				await fetchTasks();
				await fetchActivities();
				addToast(`Updated task: ${response.task.title}`, "success");
			}
		} catch (error) {
			console.error("Failed to update task:", error);
			addToast("Failed to update task", "error");
		}
	};

	// Optimistic update with rollback functionality
	const performOptimisticUpdate = async (
		taskId,
		fromContainer,
		toContainer,
		task
	) => {
		// Store original state for potential rollback
		const originalTasks = { ...tasks };

		// 1. Immediately update UI (optimistic update)
		setTasks((prev) => {
			const activeItems = prev[fromContainer];
			const overItems = prev[toContainer];

			// Remove from source
			const newActiveItems = activeItems.filter(
				(item) => (item._id || item.id) !== taskId
			);

			// Add to destination
			const updatedTask = { ...task, status: toContainer };
			const newOverItems = [...overItems, updatedTask];

			return {
				...prev,
				[fromContainer]: newActiveItems,
				[toContainer]: newOverItems,
			};
		});

		// 2. Show loading state
		setMovingTaskId(taskId);
		setDragPath({ from: fromContainer, to: toContainer });

		try {
			// 3. Make API request
			const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({ status: toContainer }),
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.status}`);
			}

			// 4. Success - keep the change
			addToast(
				`Moved "${task.title}" to ${
					columns.find((col) => col.id === toContainer)?.title
				}`,
				"success"
			);

			// Refresh activities
			await fetchActivities();

			// Emit socket event for real-time updates
			if (socket) {
				socket.emit("taskMoved", {
					taskId: taskId,
					from: fromContainer,
					to: toContainer,
					user: user.name,
				});
			}
		} catch (error) {
			console.error("Failed to update task:", error);

			// 5. Error - rollback to original state
			setDragState((prev) => ({ ...prev, isRollingBack: true }));

			// Animate rollback
			setTimeout(() => {
				setTasks(originalTasks);
				addToast(
					`Failed to move "${task.title}". Restored to original position.`,
					"error"
				);

				setTimeout(() => {
					setDragState((prev) => ({ ...prev, isRollingBack: false }));
				}, 500);
			}, 100);
		} finally {
			// 6. Clear loading state
			setTimeout(() => {
				setMovingTaskId(null);
				setDragPath({ from: null, to: null });
			}, 500);
		}
	};

	useEffect(() => {
		if (socket) {
			socket.on("taskUpdated", (data) => {
				addToast(`${data.user} updated a task`, "info");
				// Refresh tasks when receiving real-time updates
				fetchTasks();
				fetchActivities();
			});

			socket.on("conflictDetected", (data) => {
				setConflictData(data);
				setShowConflictModal(true);
			});

			return () => {
				socket.off("taskUpdated");
				socket.off("conflictDetected");
			};
		}
	}, [socket, addToast, fetchTasks, fetchActivities]);

	// Show loading state
	if (loading) {
		return (
			<div className="dashboard">
				<div className="loading-container">
					<div className="loading-spinner"></div>
					<p>Loading your tasks...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard">
			{/* Header */}
			<header className="dashboard-header">
				<div className="header-left">
					<motion.h1
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5 }}
						className="app-title"
					>
						CollabBoard
					</motion.h1>
					<div className="connection-status">
						<div
							className={`status-indicator ${
								isConnected ? "connected" : "disconnected"
							}`}
						/>
						<span className="text-muted">
							{isConnected ? "Connected" : "Disconnected"}
						</span>
					</div>
				</div>

				<div className="header-right">
					<motion.button
						className="btn btn-secondary"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => {
							setSelectedTask(null); // Clear selected task for new task creation
							setShowTaskModal(true);
						}}
					>
						<Plus size={16} />
						New Task
					</motion.button>

					<div className="header-actions">
						<button className="action-btn">
							<Bell size={18} />
						</button>
						<button className="action-btn">
							<Settings size={18} />
						</button>
					</div>

					<div className="user-menu">
						<div className="user-avatar">
							{user?.avatar || <User size={16} />}
						</div>
						<span className="user-name">{user?.name}</span>
						<button
							className="btn btn-secondary btn-small"
							onClick={() => {
								logout();
								addToast("Logged out successfully", "success");
							}}
						>
							<LogOut size={14} />
							Logout
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="dashboard-content">
				{/* Kanban Board */}
				<div className="kanban-container">
					{hasAnyTasks() ? (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCorners}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
						>
							<div className="kanban-board">
								{columns.map((column, index) => (
									<motion.div
										key={column.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1, duration: 0.5 }}
									>
										{" "}
										<DroppableColumn
											column={column}
											tasks={tasks[column.id]}
											onSmartAssign={handleSmartAssign}
											onTaskClick={(task) => {
												setSelectedTask(task);
												setShowTaskModal(true);
											}}
											movingTaskId={movingTaskId}
											isSourceColumn={dragPath.from === column.id}
											isTargetColumn={dragPath.to === column.id}
										/>
										{/* Add visual path line when dragging */}
										{dragPath.from === column.id && dragPath.to && (
											<div className="drag-path-line" />
										)}
									</motion.div>
								))}
							</div>{" "}
							<DragOverlay>
								{activeTask ? (
									<motion.div
										className="drag-overlay"
										initial={{ scale: 1, rotate: 0, opacity: 1 }}
										animate={{
											scale: 1.08,
											rotate: 3,
											opacity: 0.95,
											y: -10,
										}}
										transition={{
											duration: 0.2,
											type: "spring",
											stiffness: 300,
										}}
									>
										<div className="drag-preview-wrapper">
											<TaskCard
												task={activeTask}
												isDragging={true}
												className="drag-preview"
												onSmartAssign={() => {}}
												onClick={() => {}}
											/>
											{/* Add magical sparkles */}
											<div className="magic-sparkles">
												{[...Array(6)].map((_, i) => (
													<div
														key={i}
														className="sparkle"
														style={{
															left: `${Math.random() * 100}%`,
															top: `${Math.random() * 100}%`,
															animationDelay: `${i * 0.1}s`,
														}}
													/>
												))}
											</div>
										</div>
									</motion.div>
								) : null}
							</DragOverlay>
						</DndContext>
					) : (
						<motion.div
							className="empty-state"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
						>
							<div className="empty-state-content">
								<div className="empty-state-icon">
									<Plus size={48} />
								</div>
								<h2>No tasks yet</h2>
								<p className="text-muted">
									Get started by creating your first task. Click the "New Task"
									button above to begin organizing your work.
								</p>
								<motion.button
									className="btn btn-primary btn-large"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => {
										setSelectedTask(null); // Clear selected task for new task creation
										setShowTaskModal(true);
									}}
								>
									<Plus size={20} />
									Create Your First Task
								</motion.button>
							</div>
						</motion.div>
					)}
				</div>

				{/* Activity Panel */}
				<motion.div
					className="activity-sidebar"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.3, duration: 0.5 }}
				>
					<div className="sidebar-header">
						<Activity size={20} />
						<h3>Live Activity</h3>
					</div>
					<ActivityPanel activities={activities} />
				</motion.div>
			</div>

			{/* Modals */}
			<AnimatePresence>
				{showTaskModal && (
					<TaskModal
						task={selectedTask}
						onClose={() => {
							setShowTaskModal(false);
							setSelectedTask(null);
						}}
						onSave={selectedTask ? handleUpdateTask : handleCreateTask}
					/>
				)}

				{showConflictModal && (
					<ConflictModal
						conflictData={conflictData}
						onClose={() => setShowConflictModal(false)}
						onResolve={(resolution) => {
							setShowConflictModal(false);
							addToast(`Conflict resolved: ${resolution}`, "success");
						}}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Dashboard;

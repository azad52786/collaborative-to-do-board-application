import { useState, useEffect } from "react";
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

const Dashboard = ({ addToast }) => {
	const { user, logout } = useAuth();
	const { socket, isConnected } = useSocket();

	const [tasks, setTasks] = useState({
		todo: [
			{
				id: "1",
				title: "Setup Authentication",
				description: "Implement JWT-based authentication system",
				assignedTo: { name: "John Doe", avatar: "JD" },
				priority: "high",
				createdAt: new Date().toISOString(),
			},
			{
				id: "2",
				title: "Design Database Schema",
				description: "Create MongoDB schema for tasks and users",
				assignedTo: { name: "Jane Smith", avatar: "JS" },
				priority: "medium",
				createdAt: new Date().toISOString(),
			},
		],
		inProgress: [
			{
				id: "3",
				title: "Build Kanban Board",
				description: "Create drag-and-drop functionality",
				assignedTo: { name: "Bob Wilson", avatar: "BW" },
				priority: "high",
				createdAt: new Date().toISOString(),
			},
		],
		done: [
			{
				id: "4",
				title: "Project Setup",
				description: "Initialize React app with Vite",
				assignedTo: { name: "Alice Brown", avatar: "AB" },
				priority: "low",
				createdAt: new Date().toISOString(),
			},
		],
	});

	const [activities, setActivities] = useState([
		{
			id: "1",
			user: "John Doe",
			action: "moved",
			task: "Setup Authentication",
			from: "Todo",
			to: "In Progress",
			timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
		},
		{
			id: "2",
			user: "Jane Smith",
			action: "created",
			task: "Design Database Schema",
			timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
		},
		{
			id: "3",
			user: "Bob Wilson",
			action: "updated",
			task: "Build Kanban Board",
			timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
		},
	]);

	const [showTaskModal, setShowTaskModal] = useState(false);
	const [showConflictModal, setShowConflictModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [conflictData, setConflictData] = useState(null);
	const [activeTask, setActiveTask] = useState(null);
	const [movingTaskId, setMovingTaskId] = useState(null);
	const [dragPath, setDragPath] = useState({ from: null, to: null });

	const columns = [
		{ id: "todo", title: "Todo", color: "#0f3460" },
		{ id: "inProgress", title: "In Progress", color: "#533483" },
		{ id: "done", title: "Done", color: "#00d4aa" },
	];

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
			const task = tasks[activeContainer].find((task) => task.id === active.id);
			setActiveTask(task);
			setDragPath({ from: activeContainer, to: null });
		}
	};

	const findContainer = (id) => {
		if (columns.some((col) => col.id === id)) {
			return id;
		}

		// Find which column contains this task
		for (const [columnId, columnTasks] of Object.entries(tasks)) {
			if (columnTasks.find((task) => task.id === id)) {
				return columnId;
			}
		}
		return null;
	};

	const handleDragEnd = (event) => {
		const { active, over } = event;

		if (!over) {
			return;
		}

		const activeId = active.id;
		const overId = over.id;

		// Find the containers
		const activeContainer = findContainer(activeId);
		const overContainer = findContainer(overId);

		if (!activeContainer || !overContainer) {
			return;
		}

		// Find the active task
		const activeTask = tasks[activeContainer].find(
			(task) => task.id === activeId
		);
		if (!activeTask) {
			return;
		}

		if (activeContainer !== overContainer) {
			// Moving between different columns
			setMovingTaskId(activeId); // Track moving task
			setDragPath({ from: activeContainer, to: overContainer });

			setTasks((prev) => {
				const activeItems = prev[activeContainer];
				const overItems = prev[overContainer];

				// Remove item from active container
				const activeIndex = activeItems.findIndex(
					(item) => item.id === activeId
				);
				const newActiveItems = [...activeItems];
				newActiveItems.splice(activeIndex, 1);

				// Add item to over container
				let overIndex = overItems.length;
				if (overId !== overContainer) {
					// If dropping on a specific task, insert before it
					overIndex = overItems.findIndex((item) => item.id === overId);
				}

				const newOverItems = [...overItems];
				newOverItems.splice(overIndex, 0, activeTask);

				const newTasks = {
					...prev,
					[activeContainer]: newActiveItems,
					[overContainer]: newOverItems,
				};

				return newTasks;
			});

			// Clear moving task after animation
			setTimeout(() => {
				setMovingTaskId(null);
				setDragPath({ from: null, to: null });
			}, 500);

			// Add activity for cross-column move
			const newActivity = {
				id: Date.now().toString(),
				user: user.name,
				action: "moved",
				task: activeTask.title,
				from: columns.find((col) => col.id === activeContainer)?.title,
				to: columns.find((col) => col.id === overContainer)?.title,
				timestamp: new Date().toISOString(),
			};

			setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
			addToast(
				`Moving "${activeTask.title}" to ${newActivity.to}...`,
				"info",
				2000
			);

			setTimeout(() => {
				addToast(`Moved "${activeTask.title}" to ${newActivity.to}`, "success");
			}, 300);

			// Emit socket event
			if (socket) {
				socket.emit("taskMoved", {
					taskId: activeId,
					from: activeContainer,
					to: overContainer,
					user: user.name,
				});
			}
		} else {
			// Reordering within the same column
			setTasks((prev) => {
				const items = prev[activeContainer];
				const activeIndex = items.findIndex((item) => item.id === activeId);
				const overIndex = items.findIndex((item) => item.id === overId);

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
		if (!movingTaskId) {
			setDragPath({ from: null, to: null });
		}
	};

	const handleSmartAssign = (taskId) => {
		// Mock smart assignment logic
		const availableUsers = [
			{ name: "John Doe", avatar: "JD", workload: 2 },
			{ name: "Jane Smith", avatar: "JS", workload: 1 },
			{ name: "Bob Wilson", avatar: "BW", workload: 3 },
			{ name: "Alice Brown", avatar: "AB", workload: 1 },
		];

		// Find user with least workload
		const bestUser = availableUsers.reduce((prev, current) =>
			prev.workload < current.workload ? prev : current
		);

		// Update task
		const newTasks = { ...tasks };
		Object.keys(newTasks).forEach((columnId) => {
			const taskIndex = newTasks[columnId].findIndex(
				(task) => task.id === taskId
			);
			if (taskIndex !== -1) {
				newTasks[columnId][taskIndex].assignedTo = bestUser;
			}
		});

		setTasks(newTasks);
		addToast(`Smart assigned to ${bestUser.name}`, "success");
	};

	const handleCreateTask = (taskData) => {
		const newTask = {
			id: Date.now().toString(),
			...taskData,
			createdAt: new Date().toISOString(),
		};

		setTasks((prev) => ({
			...prev,
			todo: [newTask, ...prev.todo],
		}));

		const newActivity = {
			id: Date.now().toString(),
			user: user.name,
			action: "created",
			task: newTask.title,
			timestamp: new Date().toISOString(),
		};

		setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
		addToast(`Created new task: ${newTask.title}`, "success");
	};

	useEffect(() => {
		if (socket) {
			socket.on("taskUpdated", (data) => {
				addToast(`${data.user} updated a task`, "info");
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
	}, [socket, addToast]);

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
						onClick={() => setShowTaskModal(true)}
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
								</motion.div>
							))}
						</div>

						<DragOverlay>
							{activeTask ? (
								<div className="drag-overlay">
									<TaskCard
										task={activeTask}
										isDragging={true}
										onSmartAssign={() => {}}
										onClick={() => {}}
									/>
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
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
						onSave={handleCreateTask}
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

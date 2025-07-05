import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SortableTaskCard from "./SortableTaskCard";

const DroppableColumn = ({
	column,
	tasks,
	onSmartAssign,
	onTaskClick,
	movingTaskId,
	isSourceColumn,
	isTargetColumn,
}) => {
	const { setNodeRef, isOver } = useDroppable({
		id: column.id,
	});

	const [prevTaskCount, setPrevTaskCount] = useState(tasks.length);
	const [countUpdated, setCountUpdated] = useState(false);

	useEffect(() => {
		if (tasks.length !== prevTaskCount) {
			setCountUpdated(true);
			setPrevTaskCount(tasks.length);
			setTimeout(() => setCountUpdated(false), 600);
		}
	}, [tasks.length, prevTaskCount]);

	return (
		<div
			className={`kanban-column ${isSourceColumn ? "sending" : ""} ${
				isTargetColumn ? "receiving" : ""
			}`}
		>
			<div className="column-header" style={{ borderTopColor: column.color }}>
				<h3>{column.title}</h3>
				<span className={`task-count ${countUpdated ? "updated" : ""}`}>
					{tasks.length}
				</span>
				{isSourceColumn && (
					<motion.div
						className="source-indicator"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
					>
						📤
					</motion.div>
				)}
				{isTargetColumn && (
					<motion.div
						className="target-indicator"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
					>
						📥
					</motion.div>
				)}
			</div>

			<div
				ref={setNodeRef}
				className={`column-content ${isOver ? "drag-over" : ""}`}
				style={{ minHeight: "500px", position: "relative" }}
			>
				<SortableContext
					items={tasks.map((task) => task.id)}
					strategy={verticalListSortingStrategy}
				>
					{tasks.map((task) => (
						<SortableTaskCard
							key={task.id}
							task={task}
							onSmartAssign={() => onSmartAssign(task.id)}
							onClick={() => onTaskClick(task)}
							isMoving={movingTaskId === task.id}
						/>
					))}
				</SortableContext>

				{/* Empty drop zone when no tasks */}
				{tasks.length === 0 && (
					<div className="empty-column-placeholder">
						<p>Drop tasks here</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default DroppableColumn;

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

const SortableTaskCard = ({ task, onSmartAssign, onClick, isMoving }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: task.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
		zIndex: isDragging ? 1000 : "auto",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`sortable-task-wrapper ${isDragging ? "sortable-ghost" : ""} ${
				isMoving ? "moving" : ""
			}`}
		>
			<TaskCard
				task={task}
				onSmartAssign={onSmartAssign}
				onClick={onClick}
				isDragging={isDragging}
				className={isMoving ? "moving" : ""}
			/>
		</div>
	);
};

export default SortableTaskCard;

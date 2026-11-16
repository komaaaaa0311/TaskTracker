import { useState } from "react";
import type { Todo, TodoCategory } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faClock,
  faTrash,
  faPen,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

const CATEGORIES: TodoCategory[] = [
  "学校・仕事",
  "買い物",
  "プライベート",
  "その他",
];

type Props = {
  todo: Todo;
  updateIsDone: (id: string, value: boolean) => void;
  updateTodo: (
    id: string,
    updates: {
      name: string;
      priority: number;
      deadline: Date | null;
      category: TodoCategory;
    },
  ) => void;
  remove: (id: string) => void;
};

const TodoItem = (props: Props) => {
  const { todo, updateIsDone, updateTodo, remove } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(todo.name);
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [editCategory, setEditCategory] = useState<TodoCategory>(todo.category);
  const [editDeadline, setEditDeadline] = useState<Date | null>(todo.deadline);

  const isOverdue =
    !todo.isDone && todo.deadline !== null && dayjs(todo.deadline).isBefore(dayjs());
  const isDueSoon =
    !todo.isDone &&
    !isOverdue &&
    todo.deadline !== null &&
    dayjs(todo.deadline).diff(dayjs(), "hour", true) < 24;

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed.length < 2 || trimmed.length > 32) return;
    updateTodo(todo.id, {
      name: trimmed,
      priority: editPriority,
      deadline: editDeadline,
      category: editCategory,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2 rounded-md border border-indigo-400 bg-indigo-50/60 p-3 shadow-sm dark:border-indigo-500 dark:bg-slate-800">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as TodoCategory)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={editPriority}
            onChange={(e) => setEditPriority(Number(e.target.value))}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value={1}>優先度: 低</option>
            <option value={2}>優先度: 中</option>
            <option value={3}>優先度: 高</option>
          </select>

          <input
            type="datetime-local"
            value={
              editDeadline
                ? dayjs(editDeadline).format("YYYY-MM-DDTHH:mm:ss")
                : ""
            }
            onChange={(e) =>
              setEditDeadline(
                e.target.value === "" ? null : new Date(e.target.value),
              )
            }
            className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:[color-scheme:dark]"
          />

          <div className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={handleSaveEdit}
              className="cursor-pointer rounded bg-indigo-600 px-2.5 py-1 font-bold text-white hover:bg-indigo-700"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-1" />
              保存
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="cursor-pointer rounded bg-slate-400 px-2.5 py-1 font-bold text-white hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              <FontAwesomeIcon icon={faXmark} className="mr-1" />
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "flex items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 shadow-sm transition dark:border-slate-700 dark:bg-slate-800",
        todo.isDone && "bg-slate-100/80 opacity-65 dark:bg-slate-800/50",
        isOverdue &&
          "border-red-400 bg-red-50/70 dark:border-red-500/70 dark:bg-red-950/40",
        isDueSoon &&
          "border-amber-400 bg-amber-50/70 dark:border-amber-500/70 dark:bg-amber-950/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={(e) => updateIsDone(todo.id, e.target.checked)}
          className="h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {todo.category}
            </span>
            <span
              className={twMerge(
                "font-bold break-all",
                todo.isDone && "line-through",
              )}
            >
              {todo.name}
            </span>
            <span className="text-xs text-amber-500">
              {Array.from({ length: todo.priority }, (_, i) => (
                <FontAwesomeIcon key={i} icon={faStar} />
              ))}
            </span>
          </div>

          {todo.deadline && (
            <div
              className={twMerge(
                "mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400",
                isOverdue && "font-bold text-red-600 dark:text-red-400",
                isDueSoon && "font-bold text-amber-700 dark:text-amber-400",
              )}
            >
              <FontAwesomeIcon icon={faClock} />
              <span>
                {dayjs(todo.deadline).format("YYYY/MM/DD HH:mm")}
                {isOverdue && "（期限切れ）"}
                {isDueSoon && "（24時間以内）"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setEditName(todo.name);
            setEditPriority(todo.priority);
            setEditCategory(todo.category);
            setEditDeadline(todo.deadline);
            setIsEditing(true);
          }}
          aria-label="タスクを編集"
          className="cursor-pointer rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button
          type="button"
          onClick={() => remove(todo.id)}
          aria-label="タスクを削除"
          className="cursor-pointer rounded p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950 dark:hover:text-rose-400"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
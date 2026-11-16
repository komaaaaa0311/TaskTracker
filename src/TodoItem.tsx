import { useState } from "react";
import type { Todo, TodoCategory } from "./types";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faPersonDigging,
  faPen,
  faTrash,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

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

const CATEGORIES: TodoCategory[] = [
  "学校・仕事",
  "買い物",
  "プライベート",
  "その他",
];

const categoryBadgeStyle: Record<TodoCategory, string> = {
  "学校・仕事": "bg-indigo-100 text-indigo-700 border-indigo-200",
  買い物: "bg-emerald-100 text-emerald-700 border-emerald-200",
  プライベート: "bg-amber-100 text-amber-700 border-amber-200",
  その他: "bg-slate-100 text-slate-600 border-slate-200",
};

// 星の数が多いほど優先度が高い（1: ★, 2: ★★, 3: ★★★）
const num2star = (n: number): string =>
  "★".repeat(Math.min(Math.max(n, 1), 3));

const formattedDate = (date: Date) => {
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return dayjs(date).format("YYYY/MM/DD");
  }
  return dayjs(date).format("YYYY/MM/DD HH:mm");
};

const getDeadlineStatus = (
  deadline: Date | null,
  isDone: boolean,
): "overdue" | "soon" | "normal" => {
  if (!deadline || isDone) return "normal";
  const now = dayjs();
  const target = dayjs(deadline);
  if (target.isBefore(now)) return "overdue";
  if (target.diff(now, "hour") < 24) return "soon";
  return "normal";
};

const TodoItem = (props: Props) => {
  const { todo } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(todo.name);
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [editCategory, setEditCategory] = useState<TodoCategory>(todo.category);
  const [editDeadline, setEditDeadline] = useState<string>(
    todo.deadline ? dayjs(todo.deadline).format("YYYY-MM-DDTHH:mm") : "",
  );

  const deadlineStatus = getDeadlineStatus(todo.deadline, todo.isDone);

  const startEditing = () => {
    setEditName(todo.name);
    setEditPriority(todo.priority);
    setEditCategory(todo.category);
    setEditDeadline(
      todo.deadline ? dayjs(todo.deadline).format("YYYY-MM-DDTHH:mm") : "",
    );
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed.length < 2 || trimmed.length > 32) return;
    props.updateTodo(todo.id, {
      name: trimmed,
      priority: editPriority,
      category: editCategory,
      deadline: editDeadline === "" ? null : new Date(editDeadline),
    });
    setIsEditing(false);
  };

  if (isEditing) {
    const isInvalid = editName.trim().length < 2 || editName.trim().length > 32;
    return (
      <div className="space-y-2 rounded-md border-2 border-indigo-400 bg-indigo-50/40 p-3 drop-shadow">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="2〜32文字で入力"
            className="min-w-0 grow rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
          />
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as TodoCategory)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">優先度:</span>
            {["低", "中", "高"].map((label, index) => (
              <label key={label} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name={`edit-priority-${todo.id}`}
                  value={index + 1}
                  checked={editPriority === index + 1}
                  onChange={(e) => setEditPriority(Number(e.target.value))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <input
            type="datetime-local"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="cursor-pointer rounded-md bg-slate-400 px-3 py-1 text-xs font-bold text-white hover:bg-slate-500"
          >
            <FontAwesomeIcon icon={faXmark} className="mr-1" />
            キャンセル
          </button>
          <button
            type="button"
            disabled={isInvalid}
            onClick={handleSaveEdit}
            className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-1" />
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "flex items-center justify-between gap-3 rounded-md border bg-white px-4 py-2 drop-shadow",
        deadlineStatus === "overdue"
          ? "border-red-400 bg-red-50/40"
          : deadlineStatus === "soon"
            ? "border-amber-400 bg-amber-50/30"
            : "border-slate-300",
      )}
    >
      <div
        className={twMerge(
          "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1",
          todo.isDone && "opacity-60",
        )}
      >
        <label className="flex min-w-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={todo.isDone}
            onChange={(e) => props.updateIsDone(todo.id, e.target.checked)}
            className="mr-3 shrink-0 cursor-pointer"
          />
          <FontAwesomeIcon
            icon={faPersonDigging}
            className="mr-2 shrink-0 text-slate-500"
          />
          <span
            className={twMerge(
              "min-w-0 text-lg font-medium wrap-anywhere text-slate-700",
              todo.isDone && "line-through",
            )}
          >
            {todo.name}
          </span>
        </label>

        <span
          className={twMerge(
            "rounded border px-2 py-0.5 text-xs font-medium",
            categoryBadgeStyle[todo.category],
          )}
        >
          {todo.category}
        </span>

        <span
          aria-label={`優先度: ${todo.priority}`}
          className="tracking-tighter text-orange-400"
        >
          {num2star(todo.priority)}
        </span>

        {todo.deadline && (
          <span
            className={twMerge(
              "flex items-center text-sm",
              deadlineStatus === "overdue"
                ? "font-bold text-red-600"
                : deadlineStatus === "soon"
                  ? "font-bold text-amber-600"
                  : "text-slate-500",
            )}
          >
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            {formattedDate(todo.deadline)}
            {deadlineStatus === "overdue" && (
              <span className="ml-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white">
                期限切れ
              </span>
            )}
            {deadlineStatus === "soon" && (
              <span className="ml-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">
                まもなく
              </span>
            )}
          </span>
        )}

        {todo.isDone && (
          <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-medium text-white">
            完了済み
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${todo.name}を編集`}
          className="cursor-pointer rounded-md bg-slate-200 px-2 py-1 text-sm font-bold text-slate-700 hover:bg-slate-300"
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button
          type="button"
          onClick={() => props.remove(todo.id)}
          aria-label={`${todo.name}を削除`}
          className="cursor-pointer rounded-md bg-rose-400 px-2 py-1 text-sm font-bold text-white hover:bg-rose-600"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
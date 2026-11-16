import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faMagnifyingGlass,
  faDownload,
  faUpload,
  faArrowUp,
  faArrowDown,
  faImage,
  faXmark,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { ChangeEvent } from "react";
import type { Todo, TodoCategory } from "./types";
import { initTodos } from "./initTodos";
import WelcomeMessage from "./WelcomeMessage";
import TodoList from "./TodoList";
import { v4 as uuid } from "uuid";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

const localStorageKey = "TodoApp";
const userNameStorageKey = "TodoApp_UserName";
const bgImageStorageKey = "TodoApp_BgImage";

// 1ページあたりの表示件数
const ITEMS_PER_PAGE = 5;

const CATEGORIES: TodoCategory[] = [
  "学校・仕事",
  "買い物",
  "プライベート",
  "その他",
];

type StoredTodo = {
  id: string;
  name: string;
  isDone: boolean;
  priority: number;
  deadline: string | null;
  category?: TodoCategory;
};

type FilterStatus = "all" | "active" | "completed";
type SortOrder = "created" | "deadline" | "priority";
type SortDirection = "asc" | "desc";

const isTodoOverdue = (todo: Todo): boolean => {
  if (todo.isDone || !todo.deadline) return false;
  return dayjs(todo.deadline).isBefore(dayjs());
};

const loadTodos = (): Todo[] => {
  const todoJsonStr = localStorage.getItem(localStorageKey);
  if (todoJsonStr === null) {
    return initTodos;
  }

  try {
    const storedTodos: StoredTodo[] = JSON.parse(todoJsonStr);
    return storedTodos.map((todo) => ({
      ...todo,
      deadline: todo.deadline === null ? null : new Date(todo.deadline),
      category: todo.category ?? "その他",
    }));
  } catch {
    return initTodos;
  }
};

const loadUserName = (): string => {
  return localStorage.getItem(userNameStorageKey) ?? "ゲスト";
};

const loadBgImage = (): string | null => {
  return localStorage.getItem(bgImageStorageKey);
};

const getTodoNameError = (name: string): string => {
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 32) {
    return "前後の空白を除いて、2文字以上、32文字以内で入力してください";
  }
  return "";
};

// localStorageの容量制限に収まるよう画像をリサイズ・圧縮する関数
const compressImageToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvasの初期化に失敗しました"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
};

const App = () => {
  const [userName, setUserName] = useState<string>(loadUserName);
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [bgImage, setBgImage] = useState<string | null>(loadBgImage);

  // 新規追加フォーム用 state
  const [newTodoName, setNewTodoName] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoDeadline, setNewTodoDeadline] = useState<Date | null>(null);
  const [newTodoCategory, setNewTodoCategory] =
    useState<TodoCategory>("学校・仕事");
  const [isNameTouched, setIsNameTouched] = useState(false);

  // 検索・絞り込み・並び替え・ページング用 state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCategory, setFilterCategory] = useState<TodoCategory | "all">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  const uncompletedCount = todos.filter((todo) => !todo.isDone).length;
  const completedCount = todos.length - uncompletedCount;
  const overdueCount = todos.filter(isTodoOverdue).length;

  const newTodoNameError = getTodoNameError(newTodoName);
  const isNewTodoNameInvalid = newTodoNameError !== "";
  const showNewTodoNameError = isNameTouched && isNewTodoNameInvalid;

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(userNameStorageKey, userName);
  }, [userName]);

  useEffect(() => {
    try {
      if (bgImage) {
        localStorage.setItem(bgImageStorageKey, bgImage);
      } else {
        localStorage.removeItem(bgImageStorageKey);
      }
    } catch {
      alert("画像サイズが大きすぎるため保存できませんでした。別の画像をお試しください。");
    }
  }, [bgImage]);

  const handleBgImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      setBgImage(compressedDataUrl);
    } catch {
      alert("背景画像の設定に失敗しました。");
    } finally {
      if (bgInputRef.current) {
        bgInputRef.current.value = "";
      }
    }
  };

  const updateNewTodoName = (e: ChangeEvent<HTMLInputElement>) => {
    setNewTodoName(e.target.value);
    setIsNameTouched(true);
  };

  const updateNewTodoPriority = (e: ChangeEvent<HTMLInputElement>) => {
    setNewTodoPriority(Number(e.target.value));
  };

  const updateDeadline = (e: ChangeEvent<HTMLInputElement>) => {
    const dt = e.target.value;
    setNewTodoDeadline(dt === "" ? null : new Date(dt));
  };

  const updateIsDone = (id: string, value: boolean) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, isDone: value } : todo,
      ),
    );
  };

  const updateTodo = (
    id: string,
    updates: {
      name: string;
      priority: number;
      deadline: Date | null;
      category: TodoCategory;
    },
  ) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, ...updates } : todo,
      ),
    );
  };

  const addNewTodo = () => {
    if (isNewTodoNameInvalid) {
      setIsNameTouched(true);
      return;
    }
    const newTodo: Todo = {
      id: uuid(),
      name: newTodoName.trim(),
      isDone: false,
      priority: newTodoPriority,
      deadline: newTodoDeadline,
      category: newTodoCategory,
    };
    setTodos((currentTodos) => [...currentTodos, newTodo]);
    setNewTodoName("");
    setNewTodoPriority(3);
    setNewTodoDeadline(null);
    setIsNameTouched(false);
  };

  const removeCompletedTodos = () => {
    setTodos((currentTodos) => currentTodos.filter((todo) => !todo.isDone));
  };

  const removeOverdueTodos = () => {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => !isTodoOverdue(todo)),
    );
  };

  const remove = (id: string) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  };

  const handleSortOrderChange = (newOrder: SortOrder) => {
    setSortOrder(newOrder);
    setCurrentPage(1);
    if (newOrder === "priority") {
      setSortDirection("desc");
    } else {
      setSortDirection("asc");
    }
  };

  // JSON エクスポート（バックアップ保存）
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(todos, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todo-backup-${dayjs().format("YYYYMMDD-HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON インポート（バックアップ復元）
  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          alert("無効なバックアップファイルです。");
          return;
        }
        const restored: Todo[] = parsed.map((item: StoredTodo) => ({
          id: typeof item.id === "string" ? item.id : uuid(),
          name: String(item.name ?? "無題のタスク").slice(0, 32),
          isDone: Boolean(item.isDone),
          priority:
            typeof item.priority === "number" &&
            [1, 2, 3].includes(item.priority)
              ? item.priority
              : 2,
          deadline: item.deadline ? new Date(item.deadline) : null,
          category:
            item.category && CATEGORIES.includes(item.category)
              ? item.category
              : "その他",
        }));
        setTodos(restored);
        setCurrentPage(1);
      } catch {
        alert("JSONファイルの読み込みに失敗しました。");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  // 絞り込みと並び替えを適用した表示用リスト
  const filteredTodos = todos.filter((todo) => {
    if (filterStatus === "active" && todo.isDone) return false;
    if (filterStatus === "completed" && !todo.isDone) return false;
    if (filterCategory !== "all" && todo.category !== filterCategory) {
      return false;
    }
    if (
      searchQuery.trim() !== "" &&
      !todo.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const visibleTodos = (() => {
    if (sortOrder === "created") {
      return sortDirection === "asc"
        ? filteredTodos
        : [...filteredTodos].reverse();
    }

    const dir = sortDirection === "asc" ? 1 : -1;

    return [...filteredTodos].sort((a, b) => {
      if (sortOrder === "deadline") {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return (a.deadline.getTime() - b.deadline.getTime()) * dir;
      }
      if (sortOrder === "priority") {
        return (a.priority - b.priority) * dir;
      }
      return 0;
    });
  })();

  // ページネーション計算（1ページ10件）
  const totalPages = Math.max(
    1,
    Math.ceil(visibleTodos.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTodos = visibleTodos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const uncompletedInPageCount = paginatedTodos.filter(
    (todo) => !todo.isDone,
  ).length;

  const completeCurrentPageTodos = () => {
    const targetIds = new Set(paginatedTodos.map((todo) => todo.id));
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        targetIds.has(todo.id) ? { ...todo, isDone: true } : todo,
      ),
    );
  };

  return (
    <div
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
      className="min-h-screen w-full bg-cover bg-fixed bg-center px-4 py-10"
    >
      <div
        className={twMerge(
          "mx-auto max-w-2xl",
          bgImage && "rounded-xl bg-white/85 p-6 shadow-lg backdrop-blur-sm",
        )}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">TaskTracker</h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* 背景画像設定・リセットボタン */}
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FontAwesomeIcon icon={faImage} className="mr-1" />
              背景画像
            </button>
            {bgImage && (
              <button
                type="button"
                onClick={() => setBgImage(null)}
                title="背景画像をリセット"
                className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <FontAwesomeIcon icon={faXmark} className="mr-1" />
                背景解除
              </button>
            )}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              onChange={handleBgImageUpload}
              className="hidden"
            />

            {/* JSON保存・復元ボタン */}
            <button
              type="button"
              onClick={handleExportJson}
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1" />
              保存(JSON)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-1" />
              復元(JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>

        <div className="mb-4">
          <WelcomeMessage
            name={userName}
            uncompletedCount={uncompletedCount}
            onUpdateName={setUserName}
          />
        </div>

        {/* 検索・絞り込み・並び替えバー */}
        <div className="mb-4 space-y-2 rounded-md border border-slate-200 bg-slate-50/90 p-3">
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="タスク名で検索..."
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* ステータス切り替えタブ */}
            <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-medium">
              {(
                [
                  { key: "all", label: `すべて (${todos.length})` },
                  { key: "active", label: `未完了 (${uncompletedCount})` },
                  { key: "completed", label: `完了済み (${completedCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilterStatus(tab.key);
                    setCurrentPage(1);
                  }}
                  className={twMerge(
                    "cursor-pointer rounded px-2.5 py-1 transition",
                    filterStatus === tab.key
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <select
                aria-label="カテゴリ絞り込み"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value as TodoCategory | "all");
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
              >
                <option value="all">全カテゴリ</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                aria-label="並び替え基準"
                value={sortOrder}
                onChange={(e) =>
                  handleSortOrderChange(e.target.value as SortOrder)
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
              >
                <option value="created">登録順</option>
                <option value="deadline">期限順</option>
                <option value="priority">優先度順</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                  setCurrentPage(1);
                }}
                aria-label={
                  sortDirection === "asc"
                    ? "現在昇順（クリックで降順に変更）"
                    : "現在降順（クリックで昇順に変更）"
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
              >
                <FontAwesomeIcon
                  icon={sortDirection === "asc" ? faArrowUp : faArrowDown}
                />
                <span>{sortDirection === "asc" ? "昇順" : "降順"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* タスク一覧（1ページあたり最大10件） */}
        <TodoList
          todos={paginatedTodos}
          totalCount={todos.length}
          updateIsDone={updateIsDone}
          updateTodo={updateTodo}
          remove={remove}
        />

        {/* ページネーションコントロール（11件以上のときに表示） */}
        {totalPages > 1 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs">
            <span className="text-slate-600">
              全 <strong>{visibleTodos.length}</strong> 件中{" "}
              <strong>{startIndex + 1}</strong>〜
              <strong>
                {Math.min(startIndex + ITEMS_PER_PAGE, visibleTodos.length)}
              </strong>{" "}
              件を表示
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, safeCurrentPage - 1))
                }
                disabled={safeCurrentPage <= 1}
                className="cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
                前へ
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={twMerge(
                      "cursor-pointer rounded border px-2.5 py-1 font-bold",
                      page === safeCurrentPage
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, safeCurrentPage + 1),
                  )
                }
                disabled={safeCurrentPage >= totalPages}
                className="cursor-pointer rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                次へ
                <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={completeCurrentPageTodos}
            disabled={uncompletedInPageCount === 0}
            className={twMerge(
              "cursor-pointer rounded-md px-3 py-1 font-medium",
              "bg-emerald-600 text-white hover:bg-emerald-700",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600",
            )}
          >
            表示中のタスクを完了 ({uncompletedInPageCount})
          </button>
          <button
            type="button"
            onClick={removeCompletedTodos}
            disabled={completedCount === 0}
            className={twMerge(
              "cursor-pointer rounded-md px-3 py-1 font-medium",
              "bg-rose-500 text-white hover:bg-rose-600",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rose-500",
            )}
          >
            完了済みのタスクを削除 ({completedCount})
          </button>

          <button
            type="button"
            onClick={removeOverdueTodos}
            disabled={overdueCount === 0}
            className={twMerge(
              "cursor-pointer rounded-md px-3 py-1 font-medium",
              "bg-amber-600 text-white hover:bg-amber-700",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-600",
            )}
          >
            期限切れのタスクを削除 ({overdueCount})
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addNewTodo();
          }}
          aria-labelledby="newTodoHeading"
          className="mt-4 space-y-3 rounded-md border border-slate-300 bg-white p-4 drop-shadow"
        >
          <h2 id="newTodoHeading" className="text-lg font-bold">
            新しいタスクの追加
          </h2>

          <div>
            <div className="flex items-center space-x-2">
              <label className="shrink-0 font-bold" htmlFor="newTodoName">
                名前
              </label>
              <input
                id="newTodoName"
                name="todoName"
                type="text"
                required
                value={newTodoName}
                onChange={updateNewTodoName}
                aria-invalid={showNewTodoNameError}
                aria-describedby={
                  showNewTodoNameError ? "newTodoNameError" : undefined
                }
                className={twMerge(
                  "min-w-0 grow rounded-md border border-gray-300 p-2",
                  showNewTodoNameError && "border-red-500 outline-red-500",
                )}
                placeholder="2文字以上、32文字以内で入力してください"
              />
            </div>
            {showNewTodoNameError && (
              <div
                id="newTodoNameError"
                aria-live="polite"
                className="mt-1 ml-10 flex items-center space-x-1 text-sm font-medium text-red-500"
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="mr-0.5"
                />
                <div>{newTodoNameError}</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="font-bold" htmlFor="newTodoCategory">
              カテゴリ
            </label>
            <select
              id="newTodoCategory"
              value={newTodoCategory}
              onChange={(e) =>
                setNewTodoCategory(e.target.value as TodoCategory)
              }
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 font-bold">優先度</div>
            <div className="flex gap-5">
              {["低", "中", "高"].map((label, index) => (
                <label key={label} className="flex items-center space-x-1">
                  <input
                    id={`priority-${index + 1}`}
                    name="priorityGroup"
                    type="radio"
                    value={index + 1}
                    checked={newTodoPriority === index + 1}
                    onChange={updateNewTodoPriority}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="font-bold" htmlFor="deadline">
              期限
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={
                newTodoDeadline
                  ? dayjs(newTodoDeadline).format("YYYY-MM-DDTHH:mm:ss")
                  : ""
              }
              onChange={updateDeadline}
              className="max-w-full min-w-0 rounded-md border border-gray-300 px-2 py-0.5"
            />
          </div>

          <button
            type="submit"
            disabled={isNewTodoNameInvalid}
            className={twMerge(
              "cursor-pointer rounded-md px-4 py-1.5",
              "bg-indigo-500 font-bold text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-500",
            )}
          >
            追加
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
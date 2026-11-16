import type { Todo } from "./types";
import { v4 as uuid } from "uuid"; // v4 を uuid という名前でインポート

export const initTodos: Todo[] = [
  {
    id: uuid(), // UUID v4 を生成してIDにセット
    name: "Todoサンプル1",
    isDone: false,
    priority: 2,
    deadline: new Date(2026, 10, 2, 17, 30),
    category: "学校・仕事"
  },
  {
    id: uuid(),
    name: "Todoサンプル2",
    isDone: false,
    priority: 3,
    deadline: null, // このTodoには期限を設定しない
    category: "買い物"
  },
  {
    id: uuid(),
    name: "Todoサンプル3",
    isDone: false,
    priority: 1,
    deadline: new Date(2026, 10, 11),
    category: "プライベート"
  },
];
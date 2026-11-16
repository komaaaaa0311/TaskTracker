import type { Todo, TodoCategory } from "./types";
import TodoItem from "./TodoItem";

type Props = {
  todos: Todo[];
  totalCount: number;
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

const TodoList = (props: Props) => {
  const { todos, totalCount, updateIsDone, updateTodo, remove } = props;

  if (todos.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white/90 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-400">
        {totalCount === 0
          ? "現在、登録されているタスクはありません。"
          : "条件に一致するタスクがありません。"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          updateIsDone={updateIsDone}
          updateTodo={updateTodo}
          remove={remove}
        />
      ))}
    </div>
  );
};

export default TodoList;
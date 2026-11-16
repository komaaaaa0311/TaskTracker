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
  const { todos, totalCount } = props;

  if (totalCount === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-red-500">
        現在、登録されているタスクはありません。
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-slate-500">
        条件に一致するタスクが見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          updateIsDone={props.updateIsDone}
          updateTodo={props.updateTodo}
          remove={props.remove}
        />
      ))}
    </div>
  );
};

export default TodoList;
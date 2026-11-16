export type TodoCategory = "学校・仕事" | "買い物" | "プライベート" | "その他";

export type Todo = {
  id: string;
  name: string;
  isDone: boolean;
  priority: number;
  deadline: Date | null;
  category: TodoCategory;
};
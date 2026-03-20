import { Request, Response } from "express";

interface Todo {
  id: number;
  title: string;
  subTypeId?: number | null;
  subType?: string | null;
  completedAt: Date | null;
}

const todos: Todo[] = [
  {
    id: 1,
    title: "Learn TypeScript",
    subTypeId: 4,
    subType: "Programming",
    completedAt: new Date(),
  },
  {
    id: 2,
    title: "Build a Node.js app",
    subTypeId: 5,
    subType: "Programming Project",
    completedAt: new Date(),
  },
  {
    id: 3,
    title: "Deploy to production",
    subTypeId: 6,
    subType: "Deployment",
    completedAt: new Date(),
  },
];

export class TodosController {
  constructor() {}

  private parseIdParam = (req: Request, res: Response): number | null => {
    const id = +req.params.id!;

    if (isNaN(id)) {
      res
        .status(400)
        .json({ error: `Invalid id: ${req.params.id} parameter` });
      return null;
    }

    return id;
  };

  public getTodos = (req: Request, res: Response) => {
    res.json(todos);
  };

  public getTodoById = (req: Request, res: Response) => {
    const id = this.parseIdParam(req, res);
    if (id === null) return;

    const todo = todos.find((t) => t.id === id);

    if (!todo)
      return res.status(404).json({ error: `Todo with id: ${id} not found` });

    res.json(todo);
  };

  public getTodosBySubTypeId = (req: Request, res: Response) => {
    const subTypeId = +req.params.subTypeId!;

    if (isNaN(subTypeId))
      return res.status(400).json({
        error: `Invalid subTypeId: ${req.params.subTypeId} parameter`,
      });

    const filteredTodos = todos.filter((t) => t.subTypeId === subTypeId);

    res.json(filteredTodos);
  };

  public createTodo = (req: Request, res: Response) => {
    const { title } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const newTodo = {
      id: todos.length + 1,
      title,
      subTypeId: null,
      subType: null,
      completedAt: null,
    };

    todos.push(newTodo);

    res.json(newTodo);
  };

  public updateTodo = (req: Request, res: Response) => {
    const id = this.parseIdParam(req, res);
    if (id === null) return;

    const todo = todos.find((t) => t.id === id);

    if (!todo)
      return res.status(404).json({ error: `Todo with id: ${id} not found` });

    const { title, completedAt } = req.body;

    todo.title = title || todo.title;

    if (completedAt === null) {
      todo.completedAt = null;
    } else {
      const completedAtDate = new Date(completedAt || todo.completedAt);
      todo.completedAt = completedAtDate;
    }

    res.json(todo);
  };

  public deleteTodo = (req: Request, res: Response) => {
    const id = this.parseIdParam(req, res);
    if (id === null) return;

    const index = todos.findIndex((t) => t.id === id);

    if (index === -1)
      return res.status(404).json({ error: `Todo with id: ${id} not found` });

    const deletedTodo = todos.splice(index, 1)[0];

    res.json(deletedTodo);
  };
}

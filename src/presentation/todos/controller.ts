import { Request, Response } from "express";
import prismaClient from "../../data/postgres";
import { CreateTodoDto, UpdateTodoDto } from "../../domain/dtos";

interface Todo {
  id: number;
  title: string;
  subTypeId?: number | null;
  subType?: string | null;
  completedAt: Date | null;
}

export class TodosController {
  constructor() {}

  private parseIdParam = (req: Request, res: Response): number | null => {
    const id = +req.params.id!;
    if (isNaN(id)) {
      res.status(400).json({ error: `Invalid id: ${req.params.id} parameter` });
      return null;
    }
    return id;
  };

  private notFoundElementResponse = (
    todo: Todo | null,
    id: number,
    res: Response,
  ) => {
    if (!todo)
      return res.status(404).json({ error: `Todo with id: ${id} not found` });
  };

  public getTodos = async (req: Request, res: Response) => {
    const todos = await prismaClient.todo.findMany();
    res.json(todos);
  };

  public getTodoById = async (req: Request, res: Response) => {
    const id = this.parseIdParam(req, res)!;
    const todo = await prismaClient.todo.findFirst({
      where: { id },
    });
    this.notFoundElementResponse(todo, id, res);
    res.json(todo);
  };

  public createTodo = async (req: Request, res: Response) => {
    const [error, createTodoDto] = CreateTodoDto.create(req.body);
    if (error) return res.status(400).json({ error });

    const newTodo = await prismaClient.todo.create({
      data: createTodoDto!,
    });
    res.json(newTodo);
  };

  public updateTodo = async (req: Request, res: Response) => {
    const id = this.parseIdParam(req, res)!;
    const todo = await prismaClient.todo.findFirst({
      where: { id },
    });

    this.notFoundElementResponse(todo, id, res);

    const [error, updateTodoDto] = UpdateTodoDto.update({ ...req.body, id });

    if (error) return res.status(400).json({ error });

    const updatedTodo = await prismaClient.todo.update({
      where: { id },
      data: updateTodoDto!.values,
    });

    res.json(updatedTodo);
  };

  public deleteTodo = async (req: Request, res: Response) => {
    const id = this.parseIdParam(req, res)!;
    const todo = await prismaClient.todo.findFirst({
      where: { id },
    });
    this.notFoundElementResponse(todo, id, res);
    const deletedTodo = await prismaClient.todo.delete({
      where: { id },
    });
    res.json(deletedTodo);
  };
}

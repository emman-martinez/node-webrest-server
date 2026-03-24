export class UpdateTodoDto {
  constructor(
    public readonly id?: number | undefined,
    public readonly title?: string | undefined,
    public readonly completedAt?: Date | null,
  ) {}

  get values() {
    const returnObj: { [key: string]: any } = {};
    if (this.title) returnObj.title = this.title;
    if (this.completedAt) returnObj.completedAt = this.completedAt;

    return returnObj;
  }

  static update(props?: {
    [key: string]: any;
  }): [string | undefined, UpdateTodoDto | undefined] {
    const { id, title, completedAt } = props || {};
    let newCompletedAt = completedAt;

    if (!id || isNaN(Number(id)))
      return ["Id property must be a valid number.", undefined];

    if (completedAt) {
      newCompletedAt = new Date(String(completedAt));
      if (newCompletedAt.toString() === "Invalid Date") {
        return ["CompletedAt property must be a valid date.", undefined];
      }
    }

    return [undefined, new UpdateTodoDto(id, title, newCompletedAt)];
  }
}

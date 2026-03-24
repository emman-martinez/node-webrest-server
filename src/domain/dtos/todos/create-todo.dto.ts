export class CreateTodoDto {
  private constructor(public readonly title: string) {}

  static create(props?: {
    [key: string]: any;
  }): [string | undefined, CreateTodoDto | undefined] {
    if (!props || typeof props !== "object")
      return ["Title property is required.", undefined];

    const title = props.title;

    if (typeof title !== "string" || !title.trim())
      return ["Title property is required.", undefined];

    return [undefined, new CreateTodoDto(title.trim())];
  }
}

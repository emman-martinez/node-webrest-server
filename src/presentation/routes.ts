import { Router } from "express";
import { TodoRoutes } from "./todos/routes";
import { HealthRoutes } from "./health/routes";

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use("/api/health", HealthRoutes.routes);
    router.use("/api/todos", TodoRoutes.routes);

    return router;
  }
}

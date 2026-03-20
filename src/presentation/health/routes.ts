import { Router } from "express";
import { HealthController } from "./comtroller";

export class HealthRoutes {
  static get routes(): Router {
    const router = Router();
    const healthController = new HealthController();

    router.get("/", healthController.getHealth);

    return router;
  }
}

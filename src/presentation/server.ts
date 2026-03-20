import * as express from "express";
import * as path from "path";

interface Options {
  port: number;
  publicPath?: string;
  routes: express.Router;
}

export class Server {
  private app = express();
  private readonly port: number;
  private readonly publicPath: string;
  private readonly routes: express.Router;

  constructor(options: Options) {
    const { port, publicPath = "public", routes } = options;
    this.port = port;
    this.publicPath = publicPath;
    this.routes = routes;
  }

  async start() {
    /* Middlewares */
    // Middleware to parse JSON bodies (e.g., application/json, raw)
    this.app.use(express.json());
    // Middleware to parse URL-encoded data (e.g., form submissions, x-www-form-urlencoded)
    this.app.use(express.urlencoded({ extended: true }));

    /* Public folder */
    this.app.use(express.static(this.publicPath));

    /* Routes */
    this.app.use(this.routes);

    // Fallback to index.html for SPA routing
    this.app.use((req, res) => {
      const indexPath = path.join(
        __dirname,
        "../../",
        this.publicPath,
        "index.html",
      );
      res.sendFile(indexPath);
    });

    /* Start the server */
    this.app.listen(this.port, () => {
      console.log(`Server is running on port: ${this.port}`);
    });
  }
}

import { Router } from "express";

import { configRouter } from "@/routes/config.js";
import { connectionsRouter } from "@/routes/connections.js";
import { keysRouter } from "@/routes/keys.js";

export const apiRouter = Router();

apiRouter.use("/keys", keysRouter);
apiRouter.use("/connections", connectionsRouter);
apiRouter.use("/config", configRouter);

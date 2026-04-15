import { Router } from "express";
import { adminRouter } from "./admin.js";
import { authRouter } from "./auth.js";
import { complianceRouter } from "./compliance.js";
import { documentsRouter } from "./documents.js";
import { filesRouter } from "./files.js";
import { frameworksRouter } from "./frameworks.js";
import { kpisRouter } from "./kpis.js";
import { recommendationsRouter } from "./recommendations.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/files", filesRouter);
apiRouter.use("/kpis", kpisRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/recommendations", recommendationsRouter);
apiRouter.use("/frameworks", frameworksRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/compliance", complianceRouter);

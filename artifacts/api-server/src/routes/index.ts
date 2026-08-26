import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emadRouter from "./emad";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/v1", emadRouter);
router.use("/", emadRouter);
router.use("/", healthRouter);

export default router;

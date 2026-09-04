import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emadRouter from "./emad";
import privacyRouter from "./privacy";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/v1", emadRouter);
router.use("/", privacyRouter);
router.use("/", emadRouter);
router.use("/", healthRouter);

export default router;

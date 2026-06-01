import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import roomsRouter from "./rooms";
import messagesRouter from "./messages";
import friendsRouter from "./friends";
import dmsRouter from "./dms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(roomsRouter);
router.use(messagesRouter);
router.use(friendsRouter);
router.use(dmsRouter);

export default router;

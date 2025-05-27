import CommentModel,{iComment} from "../models/Comment.model";
import { Request, Response } from "express";
import BaseController  from "./base.controller";

class CommentController extends BaseController<iComment> {
    constructor() {
        super(CommentModel);
    }

      async CreateItem(req: Request, res: Response) {
            const _id = (req as any).user._id;
            const comment = {
                ...req.body,
                sender: _id
            }
            req.body = comment;
            return super.CreateItem(req, res);
        }

}

export default new CommentController();
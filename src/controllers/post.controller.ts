import PostModel,{iPost} from "../models/Post.model";
import { Request, Response } from "express";
import BaseController from "./base.controller";

class PostController extends BaseController <iPost>{
    constructor() {
        super(PostModel);
    }

    async CreateItem(req: Request, res: Response) {
        const _id = (req as any).user._id;
        const post = {
            ...req.body,
            sender: _id
        }
        req.body = post;
        return super.CreateItem(req, res);
    }
}


export default new PostController();
import { Request, Response } from "express";
import { Model } from "mongoose";
import mongoose from "mongoose";

class BaseController<T> {
    model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async CreateItem(req: Request, res: Response) {
        try {
            const data = await this.model.create(req.body);
            res.status(201).send(data);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    async GetAll(req: Request, res: Response) {
        const sender = req.query.sender;
        const postId = req.params.postId;
        const filter: { sender?: string; postId?: string } = {};

        try {
            if (typeof sender === 'string') {
                filter.sender = sender;
            }

            if (postId) {
                filter.postId = postId;
            }

            const data = await this.model.find(Object.keys(filter).length > 0 ? filter : {});

            if (data.length === 0) {
                res.status(200).send([]);
                return;
            }

            res.send(data);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    async GetById(req: Request, res: Response) {
    const Id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
        return res.status(404).send("Invalid ID");
    }

    try {
        const data = await this.model.findById(Id);
        if (data) {
            res.send(data);
        } else {
            res.status(404).send("Id not found");
        }
    } catch (error) {
        res.status(400).send(error);
    }
}


 async UpdateItem(req: Request, res: Response): Promise<Response | void> {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).send("Invalid ID");
    }

    try {
        const item = await this.model.findByIdAndUpdate(id, req.body, { new: true });

        if (!item) {
            return res.status(404).send("Item not found");
        }

        res.status(200).send(item); 
    } catch (error) {
        res.status(500).send(error);
    }
}


async DeleteItem(req: Request, res: Response): Promise<Response | void> {
    const Id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
        return res.status(404).send("Invalid ID");
    }

    try {
        const deleted = await this.model.findByIdAndDelete(Id);
        if (!deleted) {
            return res.status(404).send("Item not found");
        }
        return res.status(200).send("Item deleted");
    } catch (error) {
        res.status(500).send(error);
    }
}

}

export default BaseController;
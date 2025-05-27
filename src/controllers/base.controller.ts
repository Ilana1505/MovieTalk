import { Request, Response } from "express";
import { Model } from "mongoose";

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

    async UpdateItem(req: Request, res: Response) {
        const id = req.params.id;

        try {
            const item = await this.model.findById(id);
            if (!item) {
                res.status(404).send("Item not found");
                return;
            }

            const updatedItem = await this.model.findByIdAndUpdate(id, req.body, { new: true });
            res.status(200).send(updatedItem);
        } catch (error) {
            res.status(400).send(error);
        }
    }

    async DeleteItem(req: Request, res: Response) {
        const Id = req.params.id;
        try {
            await this.model.findByIdAndDelete(Id);
            res.status(200).send("Item deleted");
        } catch (error) {
            res.status(404).send(error);
        }
    }
    
}


export default BaseController;
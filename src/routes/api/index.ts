import { Request, Response } from "express";

export default function(req: Request, res: Response) {

  res.json({
    status: "ok",
    message: "Hello API"
  })
}
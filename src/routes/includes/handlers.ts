import { Response } from "express";

export function resError(res: Response, options?: { error?: string | Error, status?: number }) {

    const { status = 400, error = "Failed" } = options || {};


    res.status(status).json({
        error
    });

}

export function resOK(res: Response, options?: { data: any, status?: number }) {

    const { status = 200, data = { status: "ok" } } = options || {};

    res.status(status).json(data);

}
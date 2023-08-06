import { Request } from "express";

export type ExtendedRequest = Request & {
    user: any
}
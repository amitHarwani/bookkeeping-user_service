import { Request, Response, NextFunction } from "express";

const asyncHandler = (
    request: (req: Request, res: Response, next: NextFunction) => Promise<Response> | Promise<void>
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        return Promise.resolve(request(req, res, next)).catch((err) => next(err));
    };
};

export default asyncHandler;
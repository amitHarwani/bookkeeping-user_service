import { db } from "../db";


export const getSelectMock = (returningObj: Array<{[key: string]: any}>) => {
    return jest.spyOn(db, "select").mockImplementation(() => {
        return {
            from: jest.fn(() => ({
                where: jest.fn(() => returningObj),
            })),
        } as any;
    });
}

export const getUpdateMock = (returningObj: Array<{[key: string]: any}>) => {
    return jest.spyOn(db, "update").mockImplementation(() => {
        return {
            set: jest.fn(() => ({
                where: jest.fn(() => ({
                    returning: jest.fn(() => returningObj)
                }))
            }))
        } as any
    });
}
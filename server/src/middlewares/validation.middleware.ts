import { RequestHandler } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { HttpException } from '../exceptions/HttpException';

const validationMiddleware = (
    type: any,
    value: string,
    skipMissingProperties = false,
    whitelist = true,
    forbidNonWhitelisted = true,
): RequestHandler => {
    return (req, res, next) => {
        
        const object = plainToClass(type, req[value]);
        
        validate(object, { skipMissingProperties, whitelist, forbidNonWhitelisted })
            .then((errors: ValidationError[]) => {
                if (errors.length > 0) {
                    const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
                    next(new HttpException(400, message));
                } else {
                    next();
                }
            });
    };
};

export default validationMiddleware;
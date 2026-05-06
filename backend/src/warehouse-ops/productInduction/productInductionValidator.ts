import { Joi } from '../../common/validators/common.js';

export const inductProductsSchema = Joi.object({
    serialNumbers: Joi.array()
        .items(Joi.string().required())
        .min(1)
        .required()
});

const Joi = require('joi')

const userSchema = Joi.object({
    FirstName: Joi.string().required(),
	LastName: Joi.string().required(),
	UserEmail: Joi.string().email({ minDomainSegments: 2, tlds: {allow: ['com', 'net']}}).required(),
    UserPasswordHash: Joi.string().pattern(new RegExp("^[A-Za-z0-9]")).required(),
    UserCPassword: Joi.ref('UserPasswordHash'),
}).with('UserPasswordHash', 'UserCPassword')

module.exports = userSchema;

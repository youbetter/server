var bcrypt = require('bcrypt');
var uuid = require('uuid');

module.exports = {
    attributes: {
        email: {
            email: true
        },
        firstName: 'string',
        id: {
            defaultsTo: function () {
                return uuid.v4();
            },
            primaryKey: true,
            type: 'string',
            unique: true,
            uuidv4: true
        },
        isPassword: function (password, cb) {
            bcrypt.compare(password, this.password, cb);
        },
        lastName: 'string',
        password: {
            type: 'string',
            required: true
        }
    },
    autoPK: false,
    beforeCreate: function (values, next) {
        bcrypt.hash(values.password, 10, function (err, hash) {
            if (err) {
                return next(err);
            }

            values.password = hash;

            next();
        });
    },
    connection: 'default',
    identity: 'user'
};

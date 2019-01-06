const Sequelize = require('sequelize');


 class SequelizeErrorFormatter {

    getMessage(error) {
        if (error instanceof Sequelize.ValidationError) {
            return JSON.stringify(error.errors);
        }
        return null;
    }

}

module.exports = new SequelizeErrorFormatter();
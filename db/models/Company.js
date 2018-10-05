module.exports = (sequelize, DataTypes) => {

    const Company = sequelize.define('company', {
        name: DataTypes.STRING,
    });

    return Company;
};
module.exports = (sequelize, DataTypes) => {

    const Mail = sequelize.define('mail', {
        from: DataTypes.STRING,
        date: DataTypes.DATE,                
        subject: DataTypes.STRING,
        proccessed: DataTypes.BOOLEAN        
    });

    Mail.associate = (models) => {
        //1:M
        Mail.belongsTo(models.Company, {
            foreignKey: 'companyId',
        });
    };

    return Mail;
};
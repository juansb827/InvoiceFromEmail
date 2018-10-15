module.exports = (sequelize, DataTypes) => {

    const Attachment = sequelize.define('Attachment', {        
        partId: DataTypes.STRING,
        name: DataTypes.STRING,
        size: DataTypes.INTEGER,
        encoding: DataTypes.STRING
    });

    Attachment.associate = (models) => {     
        //1:m
        Attachment.belongsTo(models.Email, {
            foreignKey: 'emailId',
        });
    };

    return Attachment;
};
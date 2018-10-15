module.exports = (sequelize, DataTypes) => {

    const Attachment = sequelize.define('Attachment', {        
        partId: DataTypes.STRING,
        name: DataTypes.STRING,
        size: DataTypes.INTEGER,
        encoding: DataTypes.STRING,
        processingState: {
            /**
             * UNPROCESSED - 
             * SKIPPED  - 
             * DONE - downloaded and processed (converted to invoice) 
             */
            type: DataTypes.ENUM('UNPROCESSED', 'SKIPPED', 'DONE'),
            defaultValue: 'UNPROCESSED'
        }
    });

    Attachment.associate = (models) => {     
        //1:m
        Attachment.belongsTo(models.Email, {
            foreignKey: 'emailId',
        });
    };

    return Attachment;
};
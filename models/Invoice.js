module.exports = (sequelize, DataTypes) => {

    const Invoice = sequelize.define('invoice', {
        code: {
            type: DataTypes.STRING,
            unique: true,
        },        
        received: DataTypes.DATE,                
        issue_date: DataTypes.DATE,                
        issuer_id: DataTypes.INTEGER,                        
        issuer_name: DataTypes.STRING,                        
        total: DataTypes.DECIMAL,                        
          
    });

    Invoice.associate = (models) => {
        //1:M
        Invoice.belongsTo(models.Mail, {
            foreignKey: 'mailId',
        });

        Invoice.belongsTo(models.Company, {
            foreignKey: 'companyId',
        });
    };

    return Invoice;
};
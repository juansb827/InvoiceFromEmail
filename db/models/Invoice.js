module.exports = (sequelize, DataTypes) => {

    const Invoice = sequelize.define('Invoice', {
        code: {
            type: DataTypes.STRING,
            //unique: true, ONLY REMOVE WHILE TESTING
        },        
        uuid: {
            type: DataTypes.STRING,
            //unique: true, ONLY REMOVE WHILE TESTING
        },
        received: DataTypes.DATE,                
        issue_date: DataTypes.DATE,                
        issuer_id: DataTypes.INTEGER,     //NIT                   
        issuer_name: DataTypes.STRING,    //NOMBRE_EMPRESA                    
        total: DataTypes.DECIMAL,                        
          
    });

    Invoice.associate = (models) => {        
        //1:m
        Invoice.belongsTo(models.Company, {
            foreignKey: 'companyId',
        });

        //1:m
        Invoice.belongsTo(models.Email, {
            foreignKey: 'emailId',
        });
    };

    return Invoice;
};
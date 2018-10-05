module.exports = (sequelize, DataTypes) => {

    const InvoiceItem = sequelize.define('InvoiceItem', {
        name: DataTypes.STRING,
        quantity: DataTypes.INTEGER,                
        price: DataTypes.DECIMAL        
    });

    InvoiceItem.associate = (models) => {
        //1:M
        InvoiceItem.belongsTo(models.Invoice, {
            foreignKey: 'invoiceId',
        });
    };

    return InvoiceItem;
};
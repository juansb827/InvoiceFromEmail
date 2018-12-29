module.exports = (sequelize, DataTypes) => {

    const InvoiceItem = sequelize.define('InvoiceItem', {
        code: DataTypes.STRING,
        description: DataTypes.STRING,
        quantity: DataTypes.DECIMAL,                
        price: DataTypes.DECIMAL,
        subtotal: DataTypes.DECIMAL        
    });

    InvoiceItem.associate = (models) => {
        //1:M
        InvoiceItem.belongsTo(models.Invoice, {
            foreignKey: 'invoiceId',
        });
    };

    return InvoiceItem;
};
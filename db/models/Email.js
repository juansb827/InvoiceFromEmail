'use strict';
module.exports = (sequelize, DataTypes) => {

  const Email = sequelize.define('Email', {
      from: DataTypes.STRING,
      date: DataTypes.DATE,                
      subject: DataTypes.STRING,
      proccessed: DataTypes.BOOLEAN, 
      uid: {
          type: DataTypes.STRING,
          unique: true            
        },
     batchId: DataTypes.STRING         
  });

  
  Email.associate = (models) => {
      //1:M
      Email.belongsTo(models.Company, {
          foreignKey: 'companyId',
      });
  }; 

  return Email;
};
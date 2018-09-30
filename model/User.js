module.exports =  (sequelize, DataTypes) => {

    const User = sequelize.define('user', {
      username: {
        type: DataTypes.STRING,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: DataTypes.STRING
    });
  
    User.associate = (models) => {
      //1:M
      User.belongsTo(models.Company, {        
        foreignKey: 'companyId',
      });
    };
  
    return User;
  };
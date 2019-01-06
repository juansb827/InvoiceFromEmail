module.exports = (sequelize, DataTypes) => {
  const EmailAccount = sequelize.define("EmailAccount", {
    address: {
      type: DataTypes.STRING,
      unique: true
    },
    provider: DataTypes.STRING,
    authMethod: {
      type: DataTypes.ENUM("PASSWORD", "XOAUTH2"),
      defaultValue: "PASSWORD"
    },
    password: DataTypes.TEXT,
    tokenInfo: DataTypes.TEXT
  });

  EmailAccount.associate = models => {
    //1:m
    EmailAccount.belongsTo(models.User, {
      foreignKey: "userId"
    });
  };

  const originalToJSON = EmailAccount.prototype.toJSON;
  EmailAccount.prototype.toJSON = function() {
    const json = originalToJSON.call(this);
    delete json.password;
    delete json.tokenInfo;
    return json;
  };

  return EmailAccount;
};

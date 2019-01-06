"use strict";
module.exports = (sequelize, DataTypes) => {
  const Email = sequelize.define(
    "Email",
    {
      uid: {
        // unique id of the message in the Email-Inbox
        type: DataTypes.STRING
      },
      from: DataTypes.STRING,
      emailAccount: DataTypes.STRING,
      date: DataTypes.DATE,
      subject: DataTypes.STRING,
      processingState: {
        /**
         * UNPROCESSED - only the uid of the email has been registerd
         * INFO  - info (from, subject, date etc.., attachments)of the email has been registered
         * DONE - info registered and attachments processed
         */
        type: DataTypes.ENUM("UNPROCESSED", "INFO", "DONE"),
        defaultValue: "UNPROCESSED"
      },
      attachments: DataTypes.INTEGER,
      /*
      matchingAttachments: DataTypes.INTEGER,
      attachmentsState: {
        *
         * UNPROCESSED - haven't event checked if the email has attachments
         * DONE - attachments have been successfully processed (e.g converted to invoices)
         * NO_ATTACHMENTS - this email had no attachments (at least no attachments useful for us,
         *                                                 we only care about certain .XML's and .PDF's )
         * ERROR - error processing the attachments
         * *
        type: DataTypes.ENUM("UNPROCESSED", "DONE", "ERROR"),
        defaultValue: "UNPROCESSED"
      },*/
      batchId: DataTypes.STRING
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["uid", "emailAccount"]
        }
      ]
    }
  );

  Email.associate = models => {
    Email.hasMany(models.Attachment, {
      foreignKey: "emailId"
    });

    //1:M
    Email.belongsTo(models.Company, {
      foreignKey: "companyId"
    });
  };

  

  return Email;
};

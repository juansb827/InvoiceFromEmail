require("dotenv").config();

const Promise = require("bluebird");
const crypto = require("crypto");
const async = require("async");

  

const { sequelize, Sequelize } = require("../db/models");
const Op = Sequelize.Op;
const { Email, Attachment } = require("../db/models");
const EmailHelper = require("./Email/ImapHelper/ImapHelper");

const connectionsHelper = require("./Email/ImapConnections");
const emailErrors = require("./Email/ImapHelper/Errors");

const logger = require("../utils/logger");

const EmailWorker = require('./Email/EmailWorker');
//const { processInvoice } = require('./Invoice/InvoiceProcessor');


module.exports = {
  searchEmails,      
  bulkRegister
}

 /** 
  * searchEmails emails in the inbox and registers the ones that were not already in the db 
  * for that account
  * 
  * @param emailAccount 
  * @param searchParams 
 */
 async function searchEmails(emailAccount, searchParams) {
  
  const connection = await connectionsHelper.getConnection();
  companyId = 3;
  let emailIds = await EmailHelper.findEmailIds(
    connection,
    searchParams.startingDate,
    searchParams.sender,
  );

  await connectionsHelper.releaseConnection(connection);
  //Register only the Ids of the found emails
  let unproccessedEmails = await bulkRegister(emailIds, emailAccount, companyId); //emailIds //

  //Register the rest of the information of each email (subject, data, attachments ) etcc..
  //In the background
  if (unproccessedEmails.length !== 0) {
    //startEmailWorker(emailAccount);
  }

  return unproccessedEmails;
}

/**
 *  @description - inserts the id of the email (the id which comes from the inbox) into the db
 *  so we can keep track of what emails have been already proccessed
 *  @param mailIds - list of ids to register in the Db
 *  @returns - the list of emails (only the ids uid) that were not already registered  in the db
 */
function bulkRegister(ids, emailAccount, companyId) {
  if (!ids || ids.length == 0) {
    return Promise.reject(new Error("Ids is empty"));
  }

  const batchId = crypto.randomBytes(16).toString("hex");

  const emails = ids.map(id => {
    return {
      uid: id,
      batchId: batchId,
      emailAccount: emailAccount,
      companyId: companyId

    };
  });

  return new Promise((resolve, reject) => {
    Email.bulkCreate(emails, { ignoreDuplicates: true })
      .then(() => {
        //bulkCreate doesnt return the uids so we have to do a query to find them
        return Email.findAll({
          attributes: ["id", "uid"],
          where: { batchId: batchId }
        });
      })
      .then(createdEmails => {
        const emailIds = createdEmails.map(mail => {
          return { id: mail.get("id"), uid: mail.get("uid") };
        });
        resolve(emailIds);
      })
      .catch(err => {
        reject(err);
      });
  });
}


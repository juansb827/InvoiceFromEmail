require("dotenv").config();

const Promise = require("bluebird");
const crypto = require("crypto");
const async = require("async");
var fs = require("fs"),
  fileStream;

const { sequelize, Sequelize } = require("../db/models");
const Op = Sequelize.Op;
const { Email, Attachment } = require("../db/models");
const EmailHelper = require("./Email/ImapHelper/ImapHelper");

const ImapConnections = require("./Email/ImapConnections");
const emailErrors = require("./Email/ImapHelper/Errors");
const connectionsHelper = new ImapConnections();
const logger = require("../utils/logger");

//TODO: move to express
const next = function(err, req, res, next) {
  /* We log the error internaly */

  err.statusCode = err.statusCode || 500;
  err.clientMessage = err.clientMessage || "Internal Error";

  if (err.statusCode != 500) {
    message = err.clientMessage || message;
  }
  err.requestId = "433434";
  logger.error(err);
  //res.status(err.statusCode).json({ "message": err.clientMessage });
};

//TODO: move to a route
searchEmails()
  .then(() => startEmailWorker())
  //startEmailWorker()
  .then(mailIds => {
    console.log("Finished:##", mailIds);
  })
  .catch(error => {
    if (error.originalError instanceof emailErrors.AuthenticationError) {
      error.statusCode = 400;
      error.clientMessage =
        "Autentication Error, please check email user and password";
    } else if (error.originalError instanceof emailErrors.ConnectionError) {
      error.statusCode = 400;
      error.clientMessage =
        "Could not connect with Email Server, please check email configuration";
    }
    next(error);
  });

//TODO: Should be called by route
/**
 * example :
 *      try{
 *          searchEmails
 *      }catch( err ){
 *         

 *      }
 */
async function searchEmails(searchParams) {
  const emailAccount = "juansb827@gmail.com";
  const connection = await connectionsHelper.getConnection();
  //if (1==1 )return ['3:v'];
  //'notifications@github.com'
  let emailIds = await EmailHelper.findEmailIds(
    connection,
    "September 20, 2018",
    "focuscontable@gmail.com"
  );

  await connectionsHelper.releaseConnection(connection);
  //Register only the Ids of the found emails
  let unproccessedEmails = await bulkRegister(emailIds, emailAccount); //emailIds //

  //Register the rest of the information of each email (subject, data, attachments ) etcc..
  //In the background
  if (unproccessedEmails.length !== 0) {
    //startEmailWorker(emailAccount);
  }

  return unproccessedEmails;
}

/*
* @description - starts a worker for the email account 
    (if there is already a worker for the account it doesn't do anything)     

  All State is managed through DB to achieve a Fault-Tolerant Process:
  1 - look in the database for pending emails in this account 
        (emails with status 'UNPROCESSED' or 'INFO')        
  2 - for the emails with status 'UNPROCESSED'  
       download and save info(subject, date, metadata of the attachments)  
       change the status to 'INFO'
  3 - for each email 
        - for each attachment with status 'UNPROCESSED' or (currentTime - PROCESSING_STARTED > X seconds)
            - if it is not an Invoice
                - change status to 'SKIPPED':
                - If there are no more attachments with status 'UNPROCESSED' 
                        change the Status of the email to 'PROCESSED'
            - if it is an Invoice
                - download it if not already downloaded (FileURI == null)
                - Change Attachment status to 'PROCESSING' and set time 'PROCESSING_STARTED' to currentTime, 
                    So after 'X' seconds time the attachment will be considered as UNPROCESSED,
                    this is necessary to deal with the fact that the Invoice-Proccesor may fail for 
                    some reason
                - trigger an Invoice-Processor, it will:                 
                    - Extract Invoice Data and save it in DB
                    - Mark the attachment as 'PROCESSED'
                    - Check DB and if there are no more attachments with status 'UNPROCESSED' 
                        for the  email it will change its status to 'PROCESSED'          
  
*/
async function startEmailWorker(emailAccount = "juansb827@gmail.com") {
  try {
    const pendingEmails = await getPendingEmails(emailAccount);

    const unprocessedmails = pendingEmails.filter(email => {
      return email.processingState === "UNPROCESSED";
    });

    if (unprocessedmails.length !== 0) {
      //Updates the model instance
      await getEmailsData(unprocessedmails);
      //Saves the Model in DB
      for (email of unprocessedmails) {
        await saveEmailsData(email);
      }
    }
    const connection = await connectionsHelper.getConnection(
      "juansb827@gmail.com"
    );

    for (email of pendingEmails) {
      for (attach of email.Attachments) {
        if (attach.name.indexOf("PDF") !== -1) {
          //continue;
        }

        let attachmentStream = await getAttachmentStream(
          email.uid,
          attach,
          connection
        );
        await new Promise((resolve, reject) => {
          attachmentStream
            .pipe(fs.createWriteStream("Files/" + attach.name))
            .once("error", err => {
              reject(err);
            })
            .once("finish", () => {
              resolve();
            });

          attachmentStream.once("finish", () => {
            console.log("Wrote", "Files/" + attach.name);
          });
          attachmentStream.once("error", err => {
            reject(err);
          });
        });
      }
    }

    
    console.log("savedEmails");
  } catch (err) {
    console.log(err);
  }
}

/**
 * @description - gets the emails that are not completely processed
 */
async function getPendingEmails(emailAccount) {
  return Email.findAll({
    include: [Attachment],
    where: {
      emailAccount: emailAccount,

      processingState: { [Op.not]: "DONE", [Op.not]: null }
    }
  });
}

/**
 * @description - fetches the emails and returns and array of their information (subject, date, header, attachments etc..)
 * @param - unproccessedEmails - array of { mailPK, mailUID}
 * @returns array of mail information
 */
async function getEmailsData(unproccessedEmails) {
  return new Promise(async (resolve, reject) => {
    const connection = await connectionsHelper.getConnection(
      "juansb827@gmail.com"
    );

    //object to retrieve email with its uid
    const emailsByUid = {};
    unproccessedEmails.forEach(email => {
      emailsByUid[email.uid] = email;
    });

    let remaining = unproccessedEmails.length;
    const uids = unproccessedEmails.map(mailInfo => mailInfo.uid);
    EmailHelper.fetchEmails(connection, uids)
      .on("message", async message => {
        const emailModel = emailsByUid[message.uid];

        emailModel.from = message.info.from;
        emailModel.subject = message.info.subject;
        emailModel.date = message.info.date;
        emailModel.attachments = message.attachments.length;
        emailModel.attachmentList = [];

        message.attachments.forEach(attch => {
          emailModel.Attachments.push(
            Attachment.build({
              emailId: emailsByUid[message.uid].id,
              partId: attch.partID,
              name: attch.params.name,
              size: attch.size,
              encoding: attch.encoding
            })
          );
        });

        remaining--;
        if (remaining == 0) {
          await connectionsHelper.releaseConnection(connection);
          resolve();
        }
      })
      .on("error", err => {
        reject(err);
      })
      .on("end", () => {
        console.log("End", remaining);
      });
    console.log("Start", remaining);
  });
}

var saveEmailsData = async message => {
  return sequelize.transaction(t => {
    message.processingState = "INFO";
    let chain = message.save({
      /**message, {
      where: { id: "" + message.id }, */
      transaction: t
    });

    message.Attachments.forEach(attch => {
      chain = chain.then(() => {
        return attch.save({ transaction: t });
      });
    });

    return chain;
  });
};

/**
 * @description - fetches email attachments and processes them accordingly (e.g converts them .XML into Invoices)
 * @param mailId - id of the email in the db
 * @param uid - id of the email in the inbox
 * @param attachments - array of models.Attachment instances
 */
async function getAttachmentStream(uid, attachMetadata, connection) {
  if (!uid) {
    console.log("processAttachmentsAsync", "Invalid Param");
    return;
  }

  const attchStream = await EmailHelper.getAttachmentStream(
    uid,
    attachMetadata.partId,
    attachMetadata.encoding,
    connection
  );

  return attchStream;
}

function filterAttachments(attachments) {
  return attachments.filter(part => {
    const name = part.params.name;
    if (!name) {
      return false;
    }

    const extention = name.slice(-4).toUpperCase();

    if (extention === ".XML" || extention === ".PDF") {
      return true;
    }

    return false;
  });
}

/**
 *  @description - inserts the id of the email (the id which comes from the inbox) into the db
 *  so we can keep track of what emails have been already proccessed
 *  @param mailIds - list of ids to register in the Db
 *  @returns - the list of emails (only the ids uid) that were not already registered  in the db
 */
function bulkRegister(ids, emailAccount) {
  if (!ids || ids.length == 0) {
    return Promise.reject(new Error("Ids is empty"));
  }

  const batchId = crypto.randomBytes(16).toString("hex");

  const emails = ids.map(id => {
    return {
      uid: id,
      batchId: batchId,
      emailAccount: emailAccount
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
/*
bulkRegister(['4324321332123s3','32131']).then(succ => {
    console.log('success', succ);
})
    .catch(err => {
        console.log("*************************", err);

    }) */

module.exports = {
  bulkRegister
};

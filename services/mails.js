require("dotenv").config();

const Promise = require("bluebird");
const crypto = require("crypto");
const async = require("async");
var fs = require("fs"),
  fileStream;

const { sequelize } = require("../db/models");
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
  const connection = await connectionsHelper.getConnection(
    "juansb827@gmail.com"
  );
  //if (1==1 )return ['3:v'];
  //'notifications@github.com'
  let emailIds = await EmailHelper.findEmailIds(
    connection,
    "September 20, 2018",
    "focuscontable@gmail.com"
  );

  await connectionsHelper.releaseConnection(connection);
  //Register only the Ids of the found emails
  let unregisteredEmails = await bulkRegister(emailIds); //emailIds //

  //Register the rest of the information of each email (subject, data, attachments ) etcc..
  //In the background
  if (unproccessedEmails.length !== 0) {
    registerEmailsAsync(unregisteredEmails);
  }

  return unregisteredEmails;
}

/*
* @description - starts a worker for the email account 
    (if there is already a worker for the account it doesn't do anything)     

  All State is managed through DB to achieve a Fault-Tolerant Process:
  1 - look in the database for pending emails in this account 
        (emails with status 'PROCESSING' or 'INFO')        
  2 - for the emails with status 'PROCESSING'  
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
async function startEmailWorker(emailAccount) {
  
  try {
    const emails = await getEmailsData(unregisteredEmails);
    const savedEmails = await saveEmailsData(emails); 
    //TODO
    // startWorker (savedEmails) //starts email processing worker
    console.log(savedEmails);
  } catch (err) {
      console.log(err); 
  }
}

/**
 * @description - fetches the emails and returns and array of their information (subject, date, header, attachments etc..)
 * @param - unproccessedEmails - array of { mailPK, mailUID}
 * @returns array of mail information
 */
async function getEmailsData(unproccessedEmails) {
  return new Promise(async (resolve, reject) => {
    console.log("Started email proccessing async");
    const connection = await connectionsHelper.getConnection(
      "juansb827@gmail.com"
    );
    const uids = unproccessedEmails.map(mailInfo => mailInfo.uid);
    //to retrieve email PK with its uid
    const pkByUid = {};
    unproccessedEmails.forEach(mailInfo => {
      pkByUid[mailInfo.uid] = mailInfo.id;
    });

    const emails = [];
    let remaining = unproccessedEmails.length;
    EmailHelper.fetchEmails(connection, uids)
      .on("message", async message => {
        const _msg = {
          from: message.info.from,
          subject: message.info.subject,
          date: message.info.date,
          proccessed: true,
          processingState: "INFO",
          attachments: message.attachments.length,
          attachmentList: []
        };
        _msg.id = pkByUid[message.uid];

        message.attachments.forEach(attch => {
          _msg.attachmentList.push({
            emailId: pkByUid[message.uid],
            partId: attch.partID,
            name: attch.params.name,
            size: attch.size,
            encoding: attch.encoding
          });
        });

        emails.push(_msg);
        remaining--;
        if (remaining == 0) {
          await connectionsHelper.releaseConnection(connection);
          resolve(emails);
        }
      })
      .on("error", err => {
        reject(err);
      })
      .on("end", () => {});
  });
}

saveEmailsData = async emailsData => {
  let savedEmails = [];
  for (const message of emailsData) {
    await sequelize.transaction(t => {
      let chain = Email.update(message, {
        where: { id: "" + message.id },
        transaction: t
      });

      const registeredAttchs = [];
      message.attachmentList.forEach(attch => {
        chain = chain.then(() => {
          return Attachment.create(attch, { transaction: t }
          ).then(result => {
            registeredAttchs.push(result);
          });
        });
      });

      return chain.then(() => {
        const emailDataCopy = { ...message };
        emailDataCopy.attachmentList = registeredAttchs;
        savedEmails.push(emailDataCopy);
      });
    });
  }
  return savedEmails;
};

function hue() {
  /*

            if (message.attachments.length === 0) {
                _msg.processingState = 'DONE';
                _msg.attachmentsState = 'DONE';
                _msg.matchingAttachments = 0;

                return Email.update(_msg, {
                    where: { uid: '' + message.uid }
                });

            } */

  //Registers the info of the email (and its attachments)
  //inside a transaction, so the info of the emails and its attachments
  //are always registered in an atomic operation
  return sequelize
    .transaction(t => {
      let chain = Email.update(_msg, {
        where: { uid: "" + message.uid },
        transaction: t
      });
      const registeredAttchs = [];
      message.attachments.forEach(attch => {
        chain = chain.then(() => {
          return Attachment.create(
            {
              emailId: pkByUid[message.uid],
              partId: attch.partID,
              name: attch.params.name,
              size: attch.size,
              encoding: attch.encoding
            },
            { transaction: t }
          ).then(result => {
            registeredAttchs.push(result);
          });
        });
      });

      return chain.then(() => {
        return registeredAttchs;
      });
    })
    .then(registeredAttchs => {
      console.log("TRANSACTION ENDED");
      processAttachmentsAsync(
        pkByUid[message.uid],
        message.uid,
        registeredAttchs
      );
    })
    .catch(err => {
      console.log("Transaction Failed", err);
    });

  if (1 == 1) return;
  //Starts async attachments proccessing
  Email.update(_msg, {
    where: { uid: "" + message.uid }
  })
    .then(() => {
      return processAttachmentsAsync(message.uid, message.attachments);
    })
    .then(processedCount => {
      _msg.processingState = "DONE";
      _msg.attachmentsState = "DONE";
      _msg.matchingAttachments = processedCount;
      return Email.update(_msg, {
        where: { uid: "ds" + message.uid }
      });
    })
    .catch(err => {
      //TODO: (Somehow) Retry failed emails
      console.log("Error updating email info", err);
    });
}
/**
 * @description - fetches email attachments and processes them accordingly (e.g converts them .XML into Invoices)
 * @param mailId - id of the email in the db
 * @param uid - id of the email in the inbox
 * @param attachments - array of models.Attachment instances
 */
async function processAttachmentsAsync(emailId, uid, attachments) {
  if (!uid || !attachments) {
    console.log("processAttachmentsAsync", "Invalid Param");
    return;
  }

  async function process(attch) {
    const attchPk = attch.id;
    const name = attch.name;
    const extention = name.slice(-4).toUpperCase();
    switch (extention) {
      case ".PDF":
        const task = async () => {
          const connection = await connectionsHelper.getConnection(
            "juansb827@gmail.com"
          );
          const attchStream = await EmailHelper.getAttachmentStream(
            uid,
            attch.partId,
            attch.encoding,
            connection
          );
          const fileName = "Files/" + attch.name;
          var writeStream = fs.createWriteStream(fileName);
          return new Promise((resolve, reject) => {
            writeStream.once("finish", () => {
              console.log("Wrote", fileName);
              connectionsHelper.releaseConnection(connection);
              resolve();
            });

            writeStream.on("error", err => {
              connectionsHelper.releaseConnection(connection);
              reject(err);
            });
            attchStream.pipe(writeStream);
          }).then(byteArray => {
            return Attachment.update(
              { processingState: "DONE" },
              {
                where: { id: attchPk }
              }
            );
          });
        };
        return task();

      case ".XMLL":
        return Attachment.update(
          { processingState: "DONE" },
          {
            where: { id: attchPk }
          }
        );

      default:
        return Attachment.update(
          { processingState: "SKIPPED" },
          {
            where: { id: attchPk }
          }
        );
    }
  }
  //let filtered = filterAttachments(attachments);
  new Promise((resolve, reject) => {
    async.each(attachments, process, err => {
      if (err) {
        return reject(err);
      }
      console.log(
        `All Attachments of mail ID: ${emailId}, uid:${uid} processed`
      );
      resolve();
    });
  })
    .then(() => {
      return Attachment.findAll({
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "attch_count"]
        ],
        where: { emailId: emailId, processingState: "DONE" }
      });
    })
    .then(result => {
      const count = result[0].get("attch_count");
      Email.update(
        { attachmentsState: "DONE", matchingAttachments: count },
        {
          where: { id: emailId }
        }
      );
    })
    .catch(err => {
      console.log(
        `[processAttachmentsAsync] failed for mail ID: ${emailId} with uid:${uid}`,
        err
      );
    });
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
function bulkRegister(ids) {
  if (!ids || ids.length == 0) {
    return Promise.reject(new Error("Ids is empty"));
  }

  const batchId = crypto.randomBytes(16).toString("hex");

  const emails = ids.map(id => {
    return {
      uid: id,
      batchId: batchId
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

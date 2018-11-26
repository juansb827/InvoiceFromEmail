
const fs = require("fs");
const logger = require("../../utils/logger");
const connectionsHelper = require("./ImapConnections");
const { Email, Attachment } = require("../../db/models");
const { sequelize, Sequelize } = require("../../db/models");
const ImapHelper = require("./ImapHelper/ImapHelper");
const Op = Sequelize.Op;

const activeWorkers = {}; //TODO: MOVE TO REDIS

module.exports = {
    startEmailWorker
}

/**
* @description - starts a worker for the email account    
  All State is managed through DB to achieve a Fault-Tolerant Process:
  Only the list of active workers is managed in REDIS
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
async function startEmailWorker (emailAccount)  {
  logger.info("Started worker for account: " + emailAccount);

  try {
    const pendingEmails = await getPendingEmails(emailAccount);

    const unprocessedEmails = pendingEmails.filter(email => {
      return email.processingState === "UNPROCESSED"; //Emails without attachment metadata
    });

    if (unprocessedEmails.length !== 0) {
      //Finds the Attachment Metadata and Updates the model instance
      await getEmailsData(unprocessedEmails);
      //Saves the instance in DB
      for (email of unprocessedEmails) {
        await saveEmailsData(email);
      }
    }
    const connection = await connectionsHelper.getConnection(emailAccount);

    //For Each Email downloads its attachments (if not already downloaded)
    for (email of pendingEmails) {
      for (attach of email.Attachments) {
        if (attach.processingState != "UNPROCESSED") {
          continue;
        }

        try {
          const extention = attach.name.slice(-3).toUpperCase();
          let fileURI = null;
          let processingState = "SKIPPED";

          if ("PDF,XML".includes(extention)) {

            const  attachmentStream = await ImapHelper.getAttachmentStream(
                email.uid,
                attach.partId,
                attach.encoding,
                connection
              );
            
           

            fileURI = await saveStream(attachmentStream, attach.name);
            processingState = "DOWNLOADED";

            if (extention === "PDF") {
              processingState = "DONE";
            }
          }

          attach.processingState = processingState;
          attach.fileLocation = fileURI;

          await attach.save();

          logger.info("Wrote" + fileURI);
        } catch (err) {
          logger.error(err);
        }
      }
    }

    for (email of pendingEmails) {
      for (attach of email.Attachments) {
        const extention = attach.name.slice(-3).toUpperCase();
        if (attach.processingState === "DOWNLOADED" && extention === "XML") {
          //processInvoice(attach.fileLocation, attach, email.companyId);
        }
      }
    }

    logger.info("Ended worker for account: " + emailAccount);
  } catch (err) {
    logger.error(err);
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
      [Op.and]: [
        { processingState: { [Op.ne]: "DONE" } },
        { processingState: { [Op.ne]: null } }
      ]
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
    ImapHelper.fetchEmails(connection, uids)
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

async function saveStream(stream, fileName) {
    return new Promise((resolve, reject) => {
      stream
        .pipe(fs.createWriteStream("Files/" + fileName))
        .once("error", err => {
          reject(err);
        })
        .once("finish", () => {
          resolve("Files/" + fileName);
        });
    });
  }

  
/** Starts a worker for each account with pending emails to process */
async function startWorkers() {
    const emailAccounts = await Email.findAll({
      attributes: ["emailAccount"],
      where: {
        processingState: { [Op.not]: "DONE", [Op.not]: null }
      },
      group: ["emailAccount"]
    });
  
    emailAccounts.forEach(email => {
      const account = email.emailAccount;
      checkIfCanStartWorker(account).then(canStart => {
        if (canStart) {
          startEmailWorker(account);
        }
      });
    });
}
  
  
//TODO: move logic to REDIS to make this an stateless application
async function checkIfCanStartWorker(emailAccount) {
    const limit = 1 * 60 * 1000; // 1 min
    if (activeWorkers[emailAccount]) {
      const expirationTime = activeWorkers[emailAccount];
      const current = new Date().getTime();
      if (expirationTime > current) {
        return false;
      }
    }
  
    activeWorkers[emailAccount] = new Date().getTime() + limit;
    return true;
}
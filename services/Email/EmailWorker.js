const fs = require("fs");
const logger = require("../../utils/logger");
const async = require("async");
const { Email, Attachment } = require("../../db/models");
const { sequelize, Sequelize } = require("../../db/models");
const ImapHelper = require("./ImapHelper/ImapHelper");
const Op = Sequelize.Op;

const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
//Invoice Processing Q
const SQS_INVOICE_QUEUE_URL = process.env.SQS_INVOICE_QUEUE_URL;

const activeWorkers = {}; //TODO: MOVE TO REDIS

const sampleMailConf = {
  user: "juansb827@gmail.com",
  password: process.env.PASS,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  maxConnections: 5
};

module.exports = {
  startEmailWorker,
  attempToStartWorker
};

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
async function startEmailWorker(emailAccount, connection) {
  const pendingEmails = await getPendingEmails(emailAccount);
  if (pendingEmails.length === 0) {
    return;
  }
  const unprocessedEmails = pendingEmails.filter(email => {
    return email.processingState === "UNPROCESSED"; //Emails without attachment metadata
  });

  if (unprocessedEmails.length !== 0) {
    //Finds the Attachment Metadata and Updates the model instance
    await getEmailsData(unprocessedEmails, connection);
    //Saves the instance in DB
    for (email of unprocessedEmails) {
      await saveEmailsData(email);
    }
  }

  //For Each Email downloads its attachments (if not already downloaded)
  for (email of pendingEmails) {
    for (attach of email.Attachments) {
      if (attach.processingState != "UNPROCESSED") {
        continue;
      }

      try {
        const extention = attach.name.slice(-3).toUpperCase();
        let uploadInfo = null;
        let processingState = "SKIPPED";

        if ("PDF,XML".includes(extention)) {
          const attachmentStream = await ImapHelper.getAttachmentStream(
            email.uid,
            attach.partId,
            attach.encoding,
            connection
          );

          uploadInfo = await saveStreamToS3(attachmentStream, attach.name);
          processingState = "DOWNLOADED";

          if (extention === "PDF") {
            processingState = "DONE";
          }
        }

        attach.processingState = processingState;
        attach.fileLocation = uploadInfo.fileURI;

        await attach.save();

        logger.info("Uploaded" + uploadInfo.fileURI);
      } catch (err) {
        logger.error(err);
      }
    }
  }

  for (email of pendingEmails) {    
    for (attach of email.Attachments) {
      const extention = attach.name.slice(-3).toUpperCase();
      if (attach.processingState === "DOWNLOADED" && extention === "XML") {
        await putOnInvoiceProcessinQ(
          //TODO async.parallel
          attach.fileLocation,
          email.companyId,
          attach
        );
      }
    }
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
async function getEmailsData(unproccessedEmails, connection) {
  return new Promise((resolve, reject) => {
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

async function saveStreamToS3(companyId, fileName) {
  if (!companyId) {
    throw new Error("CompanyId can not be null");
  }

  return {
    fileURI: "invoice-processor/3/face_F0900547176003a6a6278.xml"
  };

  return {
    fileURI: `${bucketName}/${companyId}/${fileName}>`,
    bucketName: bucketName,
    fileKey: fileName
  };
}

/**
 * There can only be a worker of the same email account at a given moment
 * because the max # of connections to an email account is very low */

async function attempToStartWorker(emailAccount) {
  const alreadyRunning = false; //;await checkIfRunning(emailAccount);

  if (alreadyRunning) {
    logger.info("Worker already running for :" + emailAccount);
    return;
  }

  logger.info("Started worker for account: " + emailAccount);
  const connection = await ImapHelper.getConnection(sampleMailConf);
  await connection.openBoxAsync("INBOX", true);
  await startEmailWorker(emailAccount, connection);
  logger.info("Ended worker for account: " + emailAccount);
  await connection.end();
}

//TODO: move logic to REDIS to make this an stateless application
async function checkIfRunning(emailAccount) {
  const limit = 1 * 60 * 1000; // 1 min
  if (activeWorkers[emailAccount]) {
    const expirationTime = activeWorkers[emailAccount];
    const current = new Date().getTime();
    if (expirationTime > current) {
      //Still running
      return true;
    }
  }

  activeWorkers[emailAccount] = new Date().getTime() + limit;
  return false;
}

async function putOnInvoiceProcessinQ(fileLocation, companyId, attach) {
  const divisonIndex = fileLocation.indexOf("/");
  const bucketName = fileLocation.slice(0, divisonIndex);
  const fileKey = fileLocation.slice(divisonIndex + 1);

  var payload = {
    fileLocation: {
      bucketName: bucketName,
      fileKey: fileKey
    },
    companyId: companyId,
    attachment: {
      id: attach.id,
      emailId: attach.emailId
    }
  };

  var params = {
    DelaySeconds: 0,
    MessageAttributes: {},
    MessageBody: JSON.stringify(payload),
    QueueUrl: SQS_INVOICE_QUEUE_URL
  };

  return new Promise((resolve, reject) => {
    sqs.sendMessage(params, function(err, data) {
      if (err) {
        reject(err);
      } else {
        console.log("Success", data.MessageId);
        resolve();
      }
    });
  });
}

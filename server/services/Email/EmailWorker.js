const fs = require("fs");
const logger = require("../../utils/logger");
const async = require("async");
const crypto = require("crypto");
const stream = require("stream");
const { Email, Attachment } = require("../../db/models");
const { sequelize, Sequelize } = require("../../db/models");
const imapHelper = require("./../../lib/imapHelper/");
const Op = Sequelize.Op;

const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
//Invoice Processing Q
const SQS_INVOICE_QUEUE_URL = process.env.SQS_INVOICE_QUEUE_URL;
const S3_INVOICE_BUCKET_NAME = "invoice-processor";

module.exports = {
  startEmailWorker
};
const XML_INVOICE_REGEX = /^FACE_[a-fA-F0-9]+\.XML$/;
const XML_MAX_SIZE_BYTES = Math.pow(10, 1) //1 megabyte;
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
  const result = await getPendingEmails(emailAccount);
  const pendingEmails = result.data;

  if (pendingEmails.length === 0) {
    return;
  }
  const restartAfterFinish = pendingEmails.length < result.count;

  const unprocessedEmails = pendingEmails.filter(email => {
    return email.processingState === "UNPROCESSED"; //Emails without attachment metadata
  });

  if (unprocessedEmails.length !== 0) {
    //Finds the Email and Attachment Metadata and Updates the model instance accordingly
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
        let processingState = "SKIPPED";

        if (XML_INVOICE_REGEX.test(attach.name.toUpperCase())) {
          //PDF,XML "XML".includes(extention)
          if (attach.size > XML_MAX_SIZE_BYTES) {
            processingState = "ERROR";
            attach.errorCause = `El archivo tiene un tamaño de mas de ${XML_MAX_SIZE_BYTES} Bytes`;
          } else {
            const attachmentStream = await imapHelper.getAttachmentStream(
              email.uid,
              attach.partId,
              attach.encoding,
              connection
            );

            let fileURI = await uploadToS3(
              attachmentStream,
              email.companyId,
              attach.name
            );

            processingState = "DOWNLOADED";
            if (extention === "PDF") {
              processingState = "DONE";
            }
            attach.fileLocation = fileURI;
          }
        }

        attach.processingState = processingState;
        await attach.save();
      } catch (err) {
        logger.error(err);
      }
    }
    if (email.Attachments) {
      updateStateIfNecessary(email);
    }
  }
  //Sends files that seem to be an invoice to the InvoiceQ
  for (email of pendingEmails) {
    for (attach of email.Attachments) {
      const extention = attach.name.slice(-3).toUpperCase();
      if (
        attach.processingState === "DOWNLOADED" &&
        XML_INVOICE_REGEX.test(attach.name.toUpperCase())
      ) {
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

async function updateStateIfNecessary(email) {
  let hasError = false;
  const total = email.Attachments.reduce((total, attach) => {
    const { processingState } = attach;
    if (processingState === "ERROR") {
      hasError = true;
      return total + 1;
    }

    if (processingState === "DONE" || processingState === "SKIPPED") {
      return total + 1;
    }

    return total;
  }, 0);

  let updatedState = null;
  if (total === email.Attachments.length) {
    updatedState = "DONE";
    if (hasError) {
      updatedState = "ERROR";
    }
  }
  
  if (updatedState) {
    email.processingState = updatedState;
    email.save();
  }
}

/**
 * @description - gets the emails that are not completely processed
 */
async function getPendingEmails(emailAccount) {
  const maxEmails = 100;
  const data = await Email.findAndCountAll({
    include: [Attachment],
    where: {
      emailAccount: emailAccount,
      [Op.and]: [
        { processingState: { [Op.ne]: "DONE" } },
        { processingState: { [Op.ne]: null } }
      ]
    },
    order: [["id", "ASC"]],
    offset: 0,
    limit: maxEmails
  });

  return {
    data: data.rows,
    count: data.count
  };
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
    imapHelper
      .fetchEmails(connection, uids)
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
        console.log("GetEmailData End", remaining);
      });
    console.log("GetEmailData Start", remaining);
  });
}

var saveEmailsData = async message => {
  return sequelize.transaction(t => {
    message.processingState = email.attachments === 0 ? "DONE" : "INFO";
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

async function uploadToS3(fileStream, companyId, fileName) {
  if (!companyId) {
    throw new Error("CompanyId can not be null");
  }

  const s3 = new AWS.S3();
  const pass = new stream.PassThrough();
  const uuid = crypto.randomBytes(16).toString("hex");
  const fileKey = `${companyId}/${uuid}-${fileName}`;

  const promise = s3
    .upload({
      Bucket: S3_INVOICE_BUCKET_NAME,
      Key: fileKey,
      Body: pass
    })
    .promise();

  fileStream.pipe(pass);
  await promise;

  return `${S3_INVOICE_BUCKET_NAME}/${fileKey}`;
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

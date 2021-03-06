require("dotenv").config();

const Promise = require("bluebird");
const crypto = require("crypto");

const { sequelize, Sequelize } = require("../db/models");

const { Email, Attachment } = require("../db/models");
const imapHelper = require("imapHelper");
const utils = require("./utils");
const emailErrors = require("./../lib/imapHelper/Errors");
const emailAccountService = require("./emailAccount");
const logger = require("../utils/logger");
const parameterStore = require("../lib/parameterStore");
const SQS_PENDING_EMAIL_QUEUE_URL = process.env.SQS_PENDING_EMAIL_QUEUE_URL;

const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
const appUtils = require("../lib/appUtils");

module.exports = {
  searchEmails,
  bulkRegister,
  getEmailsByCompany
};

/**
 * searchEmails emails in the inbox and registers the ones that were not already in the db
 * for that account
 *
 * @param emailAccount
 * @param searchParams
 */
async function searchEmails(emailAccountId, userId, companyId, searchParams) {
  const confParameters = await parameterStore.getParameters();

  const accountInfo = await emailAccountService.getDecryptedCredentials(
    emailAccountId,
    userId,
    confParameters.pg_encrypt_password
  );

  const connectionConf = imapHelper.getConfiguration(
    accountInfo.address,
    accountInfo.provider,
    accountInfo.authType,
    accountInfo.tokenInfo.access_token
  );

  const connection = await imapHelper.getConnection(connectionConf);
  await connection.openBoxAsync("INBOX", true);

  const imapParams = ["ALL"];
  imapParams.push(["SINCE", searchParams.startingDate]);
  imapParams.push(["BEFORE",  searchParams.endingDate]);
  if (searchParams.sender) {
    imapParams.push(["FROM", searchParams.sender]);
  }

  let emailIds = await imapHelper.findEmailIds(connection, imapParams);

  await connection.end();
  if (emailIds.length === 0) {
    return [];
  }

  //Registers only the Ids of the found emails
  let unproccessedEmails = await bulkRegister(
    emailIds,
    accountInfo.address,
    companyId
  );

  //
  if (unproccessedEmails.length !== 0) {
    appUtils.putOnPendingEmailQ(
      accountInfo.address,
      userId,
      accountInfo.id,
      SQS_PENDING_EMAIL_QUEUE_URL
    );
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

//TODO
//
async function getEmailsByCompany(companyId, options) {
  const queryOptions = {
    ...utils.getPaginationValues(options),
    order: [["id", "DESC"]],
    
  };

  const where = {
    companyId
  }
  queryOptions.where = where;

  if (options.onlyWithInvoice) {
    where.invoiceCount= {
      [Sequelize.Op.gt]: 0
    }
  }

  const data = await Email.findAndCountAll(queryOptions);

  return {
    data: data.rows,
    count: data.count
  };
}
async function getEmailsByCompany2(companyId, options) {
  const queryOptions = {
    ...utils.getPaginationValues(options),
    order: [["id", "DESC"]],
    where: {
      companyId
    }
  };

  if (options.onlyWithInvoice) {
    queryOptions.attributes = {
      include: [
        [
          sequelize.fn("COUNT", sequelize.col("Attachments.emailId")),
          "AttachCount"
        ]
      ]
    };

    queryOptions.include = [
      {
        model: Attachment,
        attributes: [],
        duplicating: false
        /*
      where: {
        processingState: 'SKIPPED'
      } */
      }
    ];
    queryOptions.group = '"Email.id"';
    //queryOptions.having = sequelize.where(sequelize.fn('COUNT', sequelize.col('Attachments.emailId')), '>', 0)
  }

  const data = await Email.findAll(queryOptions);
  //Count gets bugged when there is a 'group' in the options
  //and sends all the data so we have to remove unnecessary all the columns
  queryOptions.attributes = [
    sequelize.fn("COUNT", sequelize.col("Attachments.emailId"))
  ];
  const count = await Email.count(queryOptions);

  return {
    data: data,
    count: count.length
  };
}

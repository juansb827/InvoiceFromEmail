const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });


module.exports.putOnPendingEmailQ =  async function (emailAccount, userId, emailAccountId, queueUrl) {

    var payload = {
      emailAccount,
      userId,
      emailAccountId
    };
  
    var params = {
      DelaySeconds: 0,
      MessageAttributes: {},
      MessageBody: JSON.stringify(payload),
      QueueUrl: queueUrl
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
/**
 * Returns the state should be assigned to the email
 * bassed on the state of its attachments
 * Returns null if the state should be neither ERROR nor DONE
 * 
 */
module.exports.checkIfStateIfDoneOrError =  (attachmentList ) => {
    let hasError = false;
    const total = attachmentList.reduce((total, attach) => {
      const { processingState } = attach;
      if (processingState === "ERROR" && attach.retries >= 3) {
          
        hasError = true;
        return total + 1;
      }
  
      if (processingState === "DONE" || processingState === "SKIPPED") {
        return total + 1;
      }
  
      return total;
    }, 0);
  
    let updatedState = null;
    if (total === attachmentList.length) {
      updatedState = "DONE";
      if (hasError) {
        updatedState = "ERROR";
      }
    }
    return updatedState;
  }
  
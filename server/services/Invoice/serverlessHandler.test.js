const serverlessHandler = require('./serverlessHandler');
serverlessHandler.processInvoice({
    "Records": [
      {
        "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        "receiptHandle": "MessageReceiptHandle",
        "body": "{\"fileLocation\":{\"bucketName\":\"invoice-processor\",\"fileKey\":\"2\/e0cf40fba08ffa9512ab6bb919a741a0-face_F0900547176003a6a6278.xml\"},\"companyId\":2,\"attachment\":{\"id\":72,\"emailId\":1009}}",  
        "attributes": {
          "ApproximateReceiveCount": "1",
          "SentTimestamp": "1523232000000",
          "SenderId": "123456789012",
          "ApproximateFirstReceiveTimestamp": "1523232000001"
        },
        "messageAttributes": {},
        "md5OfBody": "7b270e59b47ff90a553787216d55d91d",
        "eventSource": "aws:sqs",
        "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
        "awsRegion": "us-east-1"
      }
    ]
  },{});
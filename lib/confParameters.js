
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const ssm = new AWS.SSM();


module.exports.getConfParameters = async (...args) => {

  var params = {
    Names: [...args],
    WithDecryption: true
  };

  
  return new Promise((resolve, reject) => {
    ssm.getParameters(params, (err, data) => {
      console.log('confParameters', data);
      if (err) return reject(err)
      
      let resp = data;
      let params = {};

      for (let p of resp.Parameters) {
        params[p.Name] = p.Value;
      }

      return resolve(params);
      
    });
  });
};

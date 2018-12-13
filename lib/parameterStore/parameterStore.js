'use strict';
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const ssm = new AWS.SSM();


let expirationTime = null;
let cachedParams = null;
let parameterNames = null; 
let cacheDuration = null;

/**
 * @param _parameterNames list of params to retrieve
 * @param _cacheDuration duration in seconds
 */
module.exports.init = (_parameterNames, _cacheDuration) => {
  if (parameterNames || cacheDuration) {
    throw new Error('Parameter store cannot be re-initialized');
  }
  parameterNames = [..._parameterNames];
  cacheDuration =  _cacheDuration || 60 * 5;  
}

module.exports.getParameters = async () => {
    
    
    if (expirationTime && expirationTime > Date.now() && cachedParams) {
      return cachedParams;
    }
       
    var params = {
        Names: parameterNames,
        WithDecryption: true
      };

    return new Promise((resolve, reject) => {

      ssm.getParameters(params, (err, data) => {
  
        if (err) return reject(err)
        
        let resp = data;
        let params = {};
  
        for (let p of resp.Parameters) {
          params[p.Name] = p.Value;
        }
        cachedParams = params;
        expirationTime = Date.now() + cacheDuration * 1000;

  
        return resolve(params);
        
      });
    });

  };
  
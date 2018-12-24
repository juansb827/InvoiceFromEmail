const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const parameterStore = require("../lib/parameterStore");

const { AppError } = require("errorManagement");
const { User } = require("../db/models");

module.exports = {
  registerUser,
  authenticateUser,
  validateRequest
};

async function registerUser(userInfo) {
  if (!userInfo.email)
    throw new AppError("Email is required", 400, "InvalidInput");
  if (!userInfo.companyId)
    throw new AppError("Company is required", 400, "InvalidInput");
  if (!userInfo.password)
    throw new AppError("Password is required", 400, "InvalidInput");

  const hashedPassword = await hashPassword(userInfo.password);
  const secret = (await parameterStore.getParameters()).app_secret         
  let user;
  try {
    user = await User.create({
      email: userInfo.email,
      companyId: userInfo.companyId,
      password: hashedPassword
    });
  } catch (err) {
    throw new AppError("Error Saving the user", 500, "UnkownError", err);
  }

  const token = await createToken(user.id, userInfo.email, userInfo.companyId, secret);
  return token;
}

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function(err, salt) {
      if (err) return reject(err);
      bcrypt.hash(password, salt, function(err, hash) {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  });
}

async function authenticateUser(userInfo) {
    
    const { email, password, companyId } = userInfo;
    if (!email)
      throw new AppError("Email is required", 400, "InvalidInput");
    if (!password)
      throw new AppError("Password is required", 400, "InvalidInput"); 
     
    
    
    const user = await User.findOne({ where: {
        email,
        companyId
    }});

    if(!user)
        throw new AppError("Invalid credentials", 401, "Unauthorized"); 
        
    const passwordIsValid = await bcrypt.compare(password, user.password);    

    if(!passwordIsValid)
        throw new AppError("Invalid credentials", 401, "Unauthorized"); 

    const secret = (await parameterStore.getParameters()).app_secret         

    return await createToken(user.id, user.email, user.companyId, secret);

    
}

async function validateRequest(req, res, next) {
  try {
    const token = (req.body && req.body.access_token) ||
  (req.query && req.query.access_token) ||
  req.headers['x-access-token'];

  if (!token)
    return next(new AppError('No token provided', 401, 'Unauthorized'));
  const secret = (await parameterStore.getParameters()).app_secret;         
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, secret, function (err, decoded) {
      if (err) {
        if (err.expiredAt)
          return reject(new AppError('Token Expired', 401, 'Unauthorized'));
        reject(new AppError('Failed to authenticate token', 500, 'UnkownError', err));          
      }
      resolve(decoded);
    });
  });  

  req.userData = decoded;
  next();
  } catch (err) {
    next(err);
  }
    
}

async function createToken(id, email, companyId, secret) {
  return new Promise((resolve, reject) => {
    const tokenData = {
      id: id,
      email: email,
      companyId: companyId,
      expiresIn: 60 * 60 * 24 // expires in 24 hours
    };

    jwt.sign(
      tokenData,
      secret,
      { expiresIn: tokenData.expiresIn },
      (err, token) => {
        if (err) return reject(err);
        resolve({
            ...tokenData,
            token: token          
        });
      }
    );
  });
}

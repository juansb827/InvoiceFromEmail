const logger = require('./logger');
const AppError = require('../errorManagement/appError');
console.log('heh');
logger.debug('hehe', '43242', {'sad':'43242'})

logger.info('hehe', '43242', JSON.stringify({'sad':'43242'}));
const err = new AppError();
logger.error('LE ERROR', {dsa: 'dsad'},err);
const winston = require("winston");
const { AppError } = require('./CustomErrors');
const level = process.env.LOG_LEVEL || 'silly';

const prodFormat = () => {
    //${info.timestamp}
    //winston.format.timestamp(),
    const replaceError = ({ label, level, message, stack }) => ({ label, level, message, stack });
    const replacer = (key, info) => {
        //when logger.level(error) is called
        if (info instanceof Error) {
            return formatError(info);
        }

        //When  logger.level(message, someObject, error ) is called
        if (info.error) {
            return formatErrorWithData(info);
        }

        //When logger.level(message) or logger.level(message, data) are called
        return formatMessage(info)
    }

    return winston.format.combine(
        winston.format.label({ label: 'Invoice Processor' }),
        winston.format.json({ replacer }));
}

const devFormat = () => {


    const formatMessage = info => {
        let output = `${info.level} MESSAGE: ${info.message}\n`;
        if (info.data) {
            output += ` DATA: ${JSON.stringify(info.data)}\n`
        }
        return output;
    }

    const formatError = info =>
        `${info.level} MESSAGE: ${info.message} \n  STACKTRACE:\n  ${info.stack}\n`;


    const formatAppError = info => {
        let output = [];
        output.push(`${info.level} MESSAGE: ${info.message}`);
        output.push(`REQUEST_ID: ${info.requestId}`);
        output.push(`STATUS_CODE: ${info.statusCode}`);
        output.push(`CLIENT_MESSAGE: ${info.clientMessage}`);

        if (info.data) {
            output.push(`DATA: ${JSON.stringify(info.data)}`);
        }

        //Stacktrace where AppErro is instantiated
        output.push(`STACKTRACE:\n  ${info.stack}`);
        
        //Stacktrace  of the error AppErro may be wrapping
        if (info.originalError) {
            if (info.originalError.stack){
                output.push(`ORIGINAL_ERROR_STACKTRACE:\n   ${info.originalError.stack}`);
            }
        }
        return output.join('\n  ');

    }        
     

        const formatErrorWithData = info => {
            let output = `${info.level} MESSAGE: ${info.message}\n`;
            if (info.data) {
                output += ` DATA: ${JSON.stringify(info.data)}\n`;
            }
            output += ` STACKTRACE:\n${info.error.stack}\n`;
            return output;
        };

        const format = info => {
            //when logger.level(error) is called
            if (info instanceof AppError) {
                return formatAppError(info);
            }

            if (info instanceof Error) {
                return formatError(info);
            }

            

            //When  logger.level(message, someObject, error ) is called
            if (info.error) {
                return formatErrorWithData(info);
            }

            //When logger.level(message) or logger.level(message, data) are called
            return formatMessage(info)
        }
        return winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(format))
    }

    /*const devFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
        })
    ); */

    let winstonLogger = winston.createLogger({
        level: level,
        format: devFormat(),
        transports: [new winston.transports.Console()]
    });


    //Wrapper that allows the log methods to receive aditional params
    const wrapper = (original) => {
        return (...args) => {

            //Two params, a message, and an object for aditional info
            if (args.length === 2) {
                const message = args[0];
                const data = args[1];
                original({ message: message, data: data });
                return;
            }

            //Three params, a message, an object for aditional info, and a error
            if (args.length === 3) {
                const message = args[0];
                const data = args[1];
                const error = args[2];
                original({ message: message, data: data, error: error });
                return;
            }

            //One param, either message or an error 
            return original(args[0]);

        };


    }

    winstonLogger.error = wrapper(winstonLogger.error);
    winstonLogger.warn = wrapper(winstonLogger.warn);
    winstonLogger.info = wrapper(winstonLogger.info);
    winstonLogger.verbose = wrapper(winstonLogger.verbose);
    winstonLogger.debug = wrapper(winstonLogger.debug);
    winstonLogger.silly = wrapper(winstonLogger.silly);


    module.exports = winstonLogger;
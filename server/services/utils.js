
module.exports.getPaginationValues = (options) => {
    const MAX_RESPONSE_ITEMS = 100;
    const DEFAULT_RESPONSE_ITEMS = 10;
    const pageSize = Math.min(options.pageSize, MAX_RESPONSE_ITEMS) || DEFAULT_RESPONSE_ITEMS;
    const pageNumber = Number(options.pageNumber) || 0;  
    return {
      offset: pageNumber * pageSize,
      limit: pageSize
    }
    
  }
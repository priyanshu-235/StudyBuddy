const judgeService = require('../services/judgeService');

module.exports = {
  getLanguageById: judgeService.getLanguageById,
  submitBatch: judgeService.submitBatch,
  submitToken: judgeService.pollSubmissions,
};

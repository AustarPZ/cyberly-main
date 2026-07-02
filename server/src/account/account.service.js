const { mapAccountRow } = require("./account.mapper");
const {
  validateAccountUpdate,
} = require("./account.validation");

function createAccountService(repository) {
  async function getAccountForUser(userId) {
    const row = await repository.findById(userId);

    if (!row) {
      const error = new Error("Account not found.");
      error.status = 404;
      throw error;
    }

    return mapAccountRow(row);
  }

  async function updateAccountForUser(userId, input) {
    const validation = validateAccountUpdate(input);

    if (!validation.ok) {
      const error = new Error("Account details are invalid.");
      error.status = 400;
      error.errors = validation.errors;
      throw error;
    }

    const row = await repository.updateById(
      userId,
      validation.value
    );

    if (!row) {
      const error = new Error("Account not found.");
      error.status = 404;
      throw error;
    }

    return mapAccountRow(row);
  }

  return {
    getAccountForUser,
    updateAccountForUser,
  };
}

module.exports = {
  createAccountService,
};
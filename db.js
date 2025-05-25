const oracledb = require('oracledb');

const dbConfig = {
  user: 'system',
  password: 'Sara_h3210',
  connectString: 'localhost/orcl' // adapt to your DB config
};

// Function to execute the query directly (without pool)
async function executeQuery(query, params = []) {
  let connection;
  try {
    // Create a new connection each time
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(query, params, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT  // 👈 Ensures plain JS objects, not complex Oracle types

    });
    return result;
  } catch (err) {
    console.error('DB Error:', err);
    throw err;
  } finally {
    if (connection) {
      await connection.close();  // Always close the connection after executing the query
    }
  }
}

module.exports = { executeQuery };

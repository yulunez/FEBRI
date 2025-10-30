const mysql = require('mysql');

// Simple pool wrapper using the existing `mysql` package.
// Exposes a `query(sql, params)` that returns a Promise resolving to [rows, fields]
// to be compatible with mysql2's promise API usage in the codebase.

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'febri',
  port: 3306,
  connectionLimit: 10,
});

module.exports = {
  query(sql, params) {
    return new Promise((resolve, reject) => {
      pool.query(sql, params, (err, results, fields) => {
        if (err) return reject(err);
        // return [rows, fields] to match mysql2 promise API shape
        resolve([results, fields]);
      });
    });
  },
  pool,
};

const userSchema = require('../validators/userRegistrationValidator')
const loginSchema = require('../validators/userLoginValidator');
const config = require('../config/userConfig')
const mssql = require('mssql')
const bcrypt = require('bcrypt')
require('dotenv').config()

module.exports = {
    registerUser: async (req, res) => {
        try {
            const {error, value} = userSchema.validate(req.body);
            if(error){
                return res.status(400).json({ error: error.details[0].message })
            }

            const user = req.body;
            const hashedPassword = await bcrypt.hash(user.UserPasswordHash, 8)
            const sql = await mssql.connect(config)

            if(sql.connected){
                const request = new mssql.Request(sql)
                request.input('FirstName', user.FirstName)
                .input('LastName', user.LastName)
                .input('UserEmail', user.UserEmail)
                .input('UserPasswordHash', hashedPassword)

                const results = await request.execute('dbo.AddUser');
                res.json(results.recordset)
            }

            
        }
        catch(e)
        {
            console.log(e);
            res.status(500).send('An error occured when registering a user')
        }
    },

    loginUser: async (req, res) => {
        try {
          const { error, value } = loginSchema.validate(req.body);
          if (error) {
            return res.status(400).json({ error: error.details[0].message });
          }
    
          const user = value;
          const sql = await mssql.connect(config);
          if (sql.connected) {
            const request = new mssql.Request(sql);
            request.input('UserEmail', user.UserEmail);
            const result = await request.query('SELECT * FROM dbo.Users WHERE UserEmail = @UserEmail');
    
            if (result.recordset.length) {
              const dbPassword = result.recordset[0].UserPasswordHash;
              const passwordsMatch = await bcrypt.compare(user.UserPasswordHash, dbPassword);
              if (passwordsMatch) {
                req.session.user = result.recordset[0];
                console.log(req.session.user);
                req.session.save((error) => {
                  if (error) {
                    console.error('Session save error:', error);
                  } else {
                    res.status(200).json({
                      success: true,
                      message: 'Logged in successfully',
                      result: req.session.user,
                    });
                  }
                });
              } else {
                res.status(401).json({
                  success: false,
                  message: 'Incorrect password',
                });
              }
            } else {
              res.status(404).json({ success: false, message: 'No user found' });
            }
          } else {
            res.status(500).json({ success: false, message: 'Database connection error' });
          }
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Login error',
          });
        }
      },

    logoutUser: (req, res) => {
      req.session.destroy((err) => {
          if (err) {
            res.status(200).json({
              success: true,
              message: 'You have been logged out',
            });
      } else {
              req.logout(() => {
                res.status(200).json({
                  success: true,
                  message: 'You have been logged out',
                });
                  res.redirect('/auth/google');
              });
          }
      });
    }
}
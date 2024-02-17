require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const mssql = require('mssql');
const config = require('../config/dbConfig.js');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const user = {
      FirstName: payload.given_name,
      LastName: payload.family_name,
      Email: payload.email,
    };

    return user;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid token');
  }
}

module.exports = { verifyGoogleToken };

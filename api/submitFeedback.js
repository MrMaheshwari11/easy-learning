const { google } = require('googleapis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rating, comments } = req.body;
  if (!rating || !comments) {
    return res.status(400).json({ error: 'Missing rating or comments' });
  }

  try {
    // Use environment variable if available, otherwise load from root directory
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
      : require('../easylearning-452317-64bd677a977e.json'); // Adjusted to root directory

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1Xk6eMPKbNJZ6jlhfVXmLLX65NyTSbzweH3sXoMg29RI'; // Your spreadsheet ID
    const range = 'Sheet1!A:C';
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[rating, comments, timestamp]],
      },
    });

    console.log('Feedback submitted:', { rating, comments, timestamp });
    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Detailed error submitting feedback:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
  }
};
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    // Netlify may send an OPTIONS request for CORS; ignore it
    return { statusCode: 200, body: 'OK' };
  }

  try {
    const b = JSON.parse(event.body);

    // Fetch existing rows to prevent duplicate submissions for the same date
    const sheet = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${process.env.SMARTSHEET_SHEET_ID}`,
      { headers: { Authorization: `Bearer ${process.env.SMARTSHEET_API_TOKEN}` } }
    );
    const alreadySubmitted = sheet.data.rows.some((row) => {
      const cell = row.cells.find((c) => c.columnId === 3017456917723);
      return cell && String(cell.value) === b.lunchDate;
    });
    if (alreadySubmitted) {
      return { statusCode: 200, body: JSON.stringify({ message: 'Already submitted for that date' }) };
    }

    const cells = [
      { columnId: 3017456917723, value: b.lunchDate },
      { columnId: 3017456917724, value: b.tasteRating },
      { columnId: 3017456917725, value: b.temperatureRating },
      { columnId: 3017456917726, value: b.overallRating },
      { columnId: 3017451145426, value: b.flowersRating },
      { columnId: 3017451145427, value: b.memorable },
      { columnId: 3017451145428, value: b.expectations }
    ];

    await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${process.env.SMARTSHEET_SHEET_ID}/rows`,
      [{ toTop: true, cells }],
      {
        headers: {
          Authorization: `Bearer ${process.env.SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { statusCode: 200, body: JSON.stringify({ message: 'Submitted!' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

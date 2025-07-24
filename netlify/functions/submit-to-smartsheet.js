const axios = require('axios');

// === Replace these with your real Smartsheet column IDs ===
const COL_LUNCH_DATE        = 3017456917723; // existing
const COL_TASTE             = 3017456917724; // existing
const COL_TEMPERATURE       = 3017456917725; // existing
const COL_OVERALL           = 3017456917726; // existing
const COL_FLOWERS           = 3017451145426; // existing
const COL_MEMORABLE         = 3017451145427; // existing
const COL_EXPECTATIONS      = 3017451145428; // existing

// New columns for reusable‐dishware page:
const COL_IMPACT_DISH       = YOUR_IMPACT_DISH_COLUMN_ID;        // e.g. 3017452000000
const COL_DISH_SATISFACTION = YOUR_DISH_SATISFACTION_COLUMN_ID;  // e.g. 3017452000001
const COL_DISH_QUALITY      = YOUR_DISH_QUALITY_COLUMN_ID;       // e.g. 3017452000002
const COL_DISH_CONVENIENCE  = YOUR_DISH_CONVENIENCE_COLUMN_ID;   // e.g. 3017452000003
const COL_DISH_FUTURE       = YOUR_DISH_FUTURE_COLUMN_ID;        // e.g. 3017452000004
const COL_DISH_CHALLENGES   = YOUR_DISH_CHALLENGES_COLUMN_ID;    // e.g. 3017452000005
// ===========================================================

exports.handler = async (event) => {
  // Handle CORS preflight or non-POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'OK' };
  }

  try {
    const b = JSON.parse(event.body);

    // 1. Fetch sheet to check duplicates by lunchDate
    const sheetRes = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${process.env.SMARTSHEET_SHEET_ID}`,
      { headers: { Authorization: `Bearer ${process.env.SMARTSHEET_API_TOKEN}` } }
    );

    const alreadySubmitted = sheetRes.data.rows.some(row => {
      const cell = row.cells.find(c => c.columnId === COL_LUNCH_DATE);
      return cell && String(cell.value) === b.lunchDate;
    });
    if (alreadySubmitted) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Already submitted for that date' })
      };
    }

    // 2. Build the cells array — preserving your existing fields + adding the new ones
    const cells = [
      { columnId: COL_LUNCH_DATE,        value: b.lunchDate },
      { columnId: COL_TASTE,             value: b.tasteRating },
      { columnId: COL_TEMPERATURE,       value: b.temperatureRating },
      { columnId: COL_OVERALL,           value: b.overallRating },
      { columnId: COL_FLOWERS,           value: b.flowersRating },

      // New reusable‐dishware ratings
      { columnId: COL_IMPACT_DISH,       value: b.impactDishRating },
      { columnId: COL_DISH_SATISFACTION, value: b.dishSatisfactionRating },
      { columnId: COL_DISH_QUALITY,      value: b.dishQualityRating },
      { columnId: COL_DISH_CONVENIENCE,  value: b.dishConvenienceRating },
      { columnId: COL_DISH_FUTURE,       value: b.dishFutureRating },
      { columnId: COL_DISH_CHALLENGES,   value: b.dishChallenges },

      // Your existing free‐text fields
      { columnId: COL_MEMORABLE,         value: b.memorable },
      { columnId: COL_EXPECTATIONS,      value: b.expectations }
    ];

    // 3. Post the new row
    await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${process.env.SMARTSHEET_SHEET_ID}/rows`,
      [
        {
          toTop: true,
          cells
        }
      ],
      {
        headers: {
          Authorization: `Bearer ${process.env.SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Submitted!' })
    };
  } catch (e) {
    console.error('Submission error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};


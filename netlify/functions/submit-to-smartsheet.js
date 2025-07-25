const axios = require('axios');
// Load environment variables from a local .env file during development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// === Smartsheet Column IDs ===
const COL_ROW_ID           = 1001; // unique identifier column
const COL_LUNCH_DATE        = 3017456917723; // existing
const COL_TASTE             = 3017456917724; // existing
const COL_TEMPERATURE       = 3017456917725; // existing
const COL_OVERALL           = 3017456917726; // existing
const COL_FLOWERS           = 3017451145426; // existing
const COL_MEMORABLE         = 3017451145427; // existing
const COL_EXPECTATIONS      = 3017451145428; // existing

// New reusable-dishware columns:
const COL_IMPACT_DISH       = 3017546529053;
const COL_DISH_SATISFACTION = 3017546529054;
const COL_DISH_QUALITY      = 3017546529055;
const COL_DISH_CONVENIENCE  = 3017546529056;
const COL_DISH_FUTURE       = 3017546529057;
const COL_DISH_CHALLENGES   = 3017546529058;

exports.handler = async (event) => {
  // CORS preflight or non-POST handling
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'OK' };
  }

  const { SMARTSHEET_API_TOKEN, SMARTSHEET_SHEET_ID } = process.env;
  if (!SMARTSHEET_API_TOKEN || !SMARTSHEET_SHEET_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Smartsheet credentials' })
    };
  }

  try {
    const b = JSON.parse(event.body);

    // 1️⃣ Build cells array
    const cells = [
      { columnId: COL_ROW_ID,            value: Date.now() },
      { columnId: COL_LUNCH_DATE,        value: b.lunchDate },
      { columnId: COL_TASTE,             value: b.tasteRating },
      { columnId: COL_TEMPERATURE,       value: b.temperatureRating },
      { columnId: COL_OVERALL,           value: b.overallRating },
      { columnId: COL_FLOWERS,           value: b.flowersRating },

      // Reusable-dishware ratings
      { columnId: COL_IMPACT_DISH,       value: b.impactDishRating },
      { columnId: COL_DISH_SATISFACTION, value: b.dishSatisfactionRating },
      { columnId: COL_DISH_QUALITY,      value: b.dishQualityRating },
      { columnId: COL_DISH_CONVENIENCE,  value: b.dishConvenienceRating },
      { columnId: COL_DISH_FUTURE,       value: b.dishFutureRating },
      { columnId: COL_DISH_CHALLENGES,   value: b.dishChallenges },

      // Original free-text fields
      { columnId: COL_MEMORABLE,         value: b.memorable },
      { columnId: COL_EXPECTATIONS,      value: b.expectations }
    ];

    // 2️⃣ Post new row to Smartsheet
    await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${SMARTSHEET_SHEET_ID}/rows`,
      [{ toTop: true, cells }],
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Submitted!' })
    };
  } catch (err) {
    console.error('Submission error:', err.response?.data || err);
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message;
    return {
      statusCode: status,
      body: JSON.stringify({ error: message })
    };
  }
};

const axios = require('axios');

// Load environment variables in dev
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// === Smartsheet Column IDs ===
const COL_LUNCH_DATE        = 3017456917723;
const COL_TASTE             = 3017456917724;
const COL_TEMPERATURE       = 3017456917725;
const COL_OVERALL           = 3017456917726;
const COL_FLOWERS           = 3017451145426;
const COL_MEMORABLE         = 3017451145427;
const COL_EXPECTATIONS      = 3017451145428;
const COL_IMPACT_DISH       = 3017546529053;
const COL_DISH_SATISFACTION = 3017546529054;
const COL_DISH_QUALITY      = 3017546529055;
const COL_DISH_CONVENIENCE  = 3017546529056;
const COL_DISH_FUTURE       = 3017546529057;
const COL_DISH_CHALLENGES   = 3017546529058;

exports.handler = async (event) => {
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

    const cells = [
      { columnId: COL_LUNCH_DATE,        value: b.lunchDate },
      { columnId: COL_TASTE,             value: b.tasteRating },
      { columnId: COL_TEMPERATURE,       value: b.temperatureRating },
      { columnId: COL_OVERALL,           value: b.overallRating },
      { columnId: COL_FLOWERS,           value: b.flowersRating },
      { columnId: COL_IMPACT_DISH,       value: b.impactDishRating },
      { columnId: COL_DISH_SATISFACTION, value: b.dishSatisfactionRating },
      { columnId: COL_DISH_QUALITY,      value: b.dishQualityRating },
      { columnId: COL_DISH_CONVENIENCE,  value: b.dishConvenienceRating },
      { columnId: COL_DISH_FUTURE,       value: b.dishFutureRating },
      { columnId: COL_DISH_CHALLENGES,   value: b.dishChallenges },
      { columnId: COL_MEMORABLE,         value: b.memorable },
      { columnId: COL_EXPECTATIONS,      value: b.expectations }
    ];

    const response = await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${SMARTSHEET_SHEET_ID}/rows`,
      [{ toTop: true, cells }],
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Submission Success:', response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Submitted!' })
    };

  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message;
    console.error('🚨 Submission Error:', err.response?.data || err);
    return {
      statusCode: status,
      body: JSON.stringify({ error: message })
    };
  }
};

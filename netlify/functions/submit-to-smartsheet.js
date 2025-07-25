const axios = require('axios');

// Load environment variables in dev
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// === ✅ Smartsheet Column IDs (Updated July 2025) ===
const COL_LUNCH_DATE        = 7713250032177028;
const COL_TASTE             = 2083750497963908;
const COL_TEMPERATURE       = 6587350125334404;
const COL_OVERALL           = 4335550311649156;
const COL_FLOWERS           = 2641208261955460;
const COL_IMPACT_DISH       = 6495860191612804;
const COL_DISH_SATISFACTION = 4244060377927556;
const COL_DISH_QUALITY      = 8747660005298052;
const COL_DISH_CONVENIENCE  = 162673215623044;
const COL_DISH_FUTURE       = 4666272842993540;
const COL_DISH_CHALLENGES   = 2414473029308292;
const COL_MEMORABLE         = 7144807889325956;
const COL_EXPECTATIONS      = 1515308355112836;

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

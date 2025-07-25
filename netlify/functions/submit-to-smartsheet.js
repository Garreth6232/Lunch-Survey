const axios = require('axios');

// Load env vars in dev
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// === ✅ Column IDs ===
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
  if (event.httpMethod !== 'POST') return { statusCode: 200, body: 'OK' };

  const { SMARTSHEET_API_TOKEN, SMARTSHEET_SHEET_ID } = process.env;
  if (!SMARTSHEET_API_TOKEN || !SMARTSHEET_SHEET_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Smartsheet credentials' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
  }

  // ✅ Light Audit — simple shape validation
  const requiredFields = [
    'lunchDate', 'tasteRating', 'temperatureRating', 'overallRating', 'flowersRating',
    'impactDishRating', 'dishSatisfactionRating', 'dishQualityRating',
    'dishConvenienceRating', 'dishFutureRating',
    'dishChallenges', 'memorable', 'expectations'
  ];

  const missing = requiredFields.filter(f => payload[f] == null || payload[f] === '');
  if (missing.length > 0) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` })
    };
  }

  // ✅ Respond IMMEDIATELY
  setTimeout(() => {
    const cells = [
      { columnId: COL_LUNCH_DATE,        value: payload.lunchDate },
      { columnId: COL_TASTE,             value: payload.tasteRating },
      { columnId: COL_TEMPERATURE,       value: payload.temperatureRating },
      { columnId: COL_OVERALL,           value: payload.overallRating },
      { columnId: COL_FLOWERS,           value: payload.flowersRating },
      { columnId: COL_IMPACT_DISH,       value: payload.impactDishRating },
      { columnId: COL_DISH_SATISFACTION, value: payload.dishSatisfactionRating },
      { columnId: COL_DISH_QUALITY,      value: payload.dishQualityRating },
      { columnId: COL_DISH_CONVENIENCE,  value: payload.dishConvenienceRating },
      { columnId: COL_DISH_FUTURE,       value: payload.dishFutureRating },
      { columnId: COL_DISH_CHALLENGES,   value: payload.dishChallenges },
      { columnId: COL_MEMORABLE,         value: payload.memorable },
      { columnId: COL_EXPECTATIONS,      value: payload.expectations }
    ];

    axios.post(
      `https://api.smartsheet.com/2.0/sheets/${SMARTSHEET_SHEET_ID}/rows`,
      [{ toTop: true, cells }],
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    ).then(res => {
      console.log('✅ Smartsheet submission successful');
    }).catch(err => {
      console.error('🚨 Smartsheet submission failed', err.response?.data || err.message);
    });
  }, 10);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Submission received' })
  };
};

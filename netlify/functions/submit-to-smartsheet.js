const axios = require('axios');

// Load environment variables in dev
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

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

const clampRating = (value) => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  const clamped = Math.max(0, Math.min(5, rating));
  return Number.isFinite(clamped) ? clamped : null;
};

const cleanText = (value, maxLength = 1000) => {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
  return cleaned.length ? cleaned : null;
};

const sanitizeDate = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { SMARTSHEET_API_TOKEN, SMARTSHEET_SHEET_ID } = process.env;
  if (!SMARTSHEET_API_TOKEN || !SMARTSHEET_SHEET_ID) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Missing Smartsheet credentials' })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    console.error('🚨 Invalid JSON payload', error);
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const reuseDishwareOptIn = Boolean(payload.reuseDishwareOptIn);

  const sanitized = {
    lunchDate: sanitizeDate(payload.lunchDate),
    tasteRating: clampRating(payload.tasteRating),
    temperatureRating: clampRating(payload.temperatureRating),
    overallRating: clampRating(payload.overallRating),
    flowersRating: clampRating(payload.flowersRating),
    impactDishRating: reuseDishwareOptIn ? clampRating(payload.impactDishRating) : null,
    dishSatisfactionRating: reuseDishwareOptIn ? clampRating(payload.dishSatisfactionRating) : null,
    dishQualityRating: reuseDishwareOptIn ? clampRating(payload.dishQualityRating) : null,
    dishConvenienceRating: reuseDishwareOptIn ? clampRating(payload.dishConvenienceRating) : null,
    dishFutureRating: reuseDishwareOptIn ? clampRating(payload.dishFutureRating) : null,
    dishChallenges: reuseDishwareOptIn ? cleanText(payload.dishChallenges) : null,
    memorable: cleanText(payload.memorable, 2000),
    expectations: cleanText(payload.expectations, 2000)
  };

  const missingFields = [];
  if (!sanitized.lunchDate) missingFields.push('lunchDate');
  if (sanitized.tasteRating === null) missingFields.push('tasteRating');
  if (sanitized.temperatureRating === null) missingFields.push('temperatureRating');
  if (sanitized.overallRating === null) missingFields.push('overallRating');
  if (sanitized.flowersRating === null) missingFields.push('flowersRating');
  if (!sanitized.memorable) missingFields.push('memorable');
  if (!sanitized.expectations) missingFields.push('expectations');

  if (missingFields.length) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: `Missing or invalid fields: ${missingFields.join(', ')}` })
    };
  }

  const cells = [
    { columnId: COL_LUNCH_DATE,        value: sanitized.lunchDate },
    { columnId: COL_TASTE,             value: sanitized.tasteRating },
    { columnId: COL_TEMPERATURE,       value: sanitized.temperatureRating },
    { columnId: COL_OVERALL,           value: sanitized.overallRating },
    { columnId: COL_FLOWERS,           value: sanitized.flowersRating },
    { columnId: COL_IMPACT_DISH,       value: sanitized.impactDishRating },
    { columnId: COL_DISH_SATISFACTION, value: sanitized.dishSatisfactionRating },
    { columnId: COL_DISH_QUALITY,      value: sanitized.dishQualityRating },
    { columnId: COL_DISH_CONVENIENCE,  value: sanitized.dishConvenienceRating },
    { columnId: COL_DISH_FUTURE,       value: sanitized.dishFutureRating },
    { columnId: COL_DISH_CHALLENGES,   value: sanitized.dishChallenges },
    { columnId: COL_MEMORABLE,         value: sanitized.memorable },
    { columnId: COL_EXPECTATIONS,      value: sanitized.expectations }
  ].filter(cell => cell.value !== null && cell.value !== undefined);

  try {
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
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Submitted!' })
    };

  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message;
    console.error('🚨 Submission Error:', err.response?.data || err);
    return {
      statusCode: status,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: message })
    };
  }
};

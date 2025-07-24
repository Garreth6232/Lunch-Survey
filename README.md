# Lunch Survey

This project contains a simple multi-page survey that submits responses to a Smartsheet using a Netlify Function. The function expects two environment variables:

- `SMARTSHEET_API_TOKEN` – your Smartsheet API token.
- `SMARTSHEET_SHEET_ID` – the ID of the sheet where rows should be appended.

For local development you can create a `.env` file by copying `.env.example` and filling in your credentials. The Netlify function will automatically load this file when `NODE_ENV` is not set to `production`.

To run the project locally:

```bash
npm install
npx netlify-cli dev
```

The survey will be available at the URL shown by `netlify dev` and form submissions will be sent to Smartsheet.

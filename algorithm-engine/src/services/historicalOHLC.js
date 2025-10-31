const { axios } = require("axios");

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    "X-API-Key": process.env.MORALIS_API_KEY,
  },
};

const tokenPairAddress = "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f";
const chain = "eth";
const timeframe = "5min";
const currency = "usd";
const fromDate = "2025-01-01T10%3A00%3A00.000"; // Lastest date and time in DB
const toDate = "2025-01-02T10%3A00%3A00.000"; // Current date and time
const limit = 50;

/*
//// Response
{
  "cursor": "",
  "page": "2",
  "pairAddress": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  "tokenAddress": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  "timeframe": "30min",
  "currency": "usd",
  "result": [
    {
      "timestamp": "",
      "open": "",
      "high": "",
      "low": "",
      "close": "",
      "volume": "",
      "trades": ""
    }
  ]
}
*/

export const historialOHLC = async (
  tokenPairAddress = "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f",
  timeframe = "5min",
  fromDate = "2025-01-01T10%3A00%3A00.000",
  toDate = "2025-01-02T10%3A00%3A00.000"
) => {
  try {
    const response = await axios(
      `https://deep-index.moralis.io/api/v2.2/pairs/${tokenPairAddress}/ohlcv?chain=${chain}&timeframe=${timeframe}&currency=${currency}&fromDate=${fromDate}&toDate=${toDate}&limit=${limit}`,
      options
    )
      .then((response) => response.json())
      .then((response) => console.log(response))
      .catch((err) => console.error(err));

    const result = response.json().result;

    const formattedResult = result.map((element) => {
      return {
        timestamp: element.timestamp,
        open: element.open,
        high: element.high,
        low: element.low,
        close: element.close,
      };
    });

    return formattedResult;
  } catch (error) {
    console.log("Error in historialOHLC(): ", error);
    throw error;
  }
};

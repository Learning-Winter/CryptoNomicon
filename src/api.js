// const API_KEY = '23d0d58872b5d2c641003a4e7e24e3dccf0d655176c64d681364c7d455844441' 
const API_KEY = '123' 
//23d0d58872b5d2c641003a4e7e24e3dccf0d655176c64d681364c7d455844441

const tickersHandlers = new Map;

// TODO: refactor to use URLSearchParams
const loadTickers = () => {
  if (tickersHandlers.size === 0) {
    return false;
  }

  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(",")}&tsyms=USD&api_key=${API_KEY}`
  ).then(r => r.json()).then(rawData =>{
    const updatedPrices = Object.fromEntries(
    Object.entries(rawData).map(([key, value]) => [key, value.USD])
    );

    Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
      const handlers = tickersHandlers.get(currency) ?? [];
      handlers.forEach(fn =>  {
        fn(newPrice)
      });
    });
  });
};


export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb])
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker)
}

setInterval(loadTickers, 5000);

window.tickersHandlers = tickersHandlers

export const loadCryptoBase = () => 
  fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  ).then(r => r.json());
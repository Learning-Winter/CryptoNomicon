import { reactive } from "vue";

// const API_KEY = '23d0d58872b5d2c641003a4e7e24e3dccf0d655176c64d681364c7d455844441' 
const API_KEY = '91d0fbb9dc6637b9a84faa2bda7c4ab7930c8919f0d9cedd23d1e2a47781f994' 
//23d0d58872b5d2c641003a4e7e24e3dccf0d655176c64d681364c7d455844441

const tickersHandlers = new Map;
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
export const listUndefinedTickers = reactive([]);
export let listCourseTikerToBTC = reactive([])



const AGGREGATE_INDEX = 5 

socket.addEventListener('message', e => {
  const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice, MESSAGE: message, PARAMETER: param} = JSON.parse(e.data);  
  
  if (message === "INVALID_SUB"){
    const paramList = param.split('~')
    const [tickerName, tickerPair] = paramList.slice(-2)

    if (tickerPair != 'BTC'){
      subscribeToTickerOnWs(tickerName, 'BTC')
      if (!listCourseTikerToBTC.includes(tickerName)) listCourseTikerToBTC.push(tickerName)
    } else {
      if (!listUndefinedTickers.includes(tickerName)) listUndefinedTickers.push(tickerName)
      // deleteTikerToBTC(tickerName)
      unsubscribeFromTickerOnWs(tickerName)
    }
  }
  // console.log(JSON.parse(e.data));
  if (type != AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }
  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach(fn =>  {
    fn(newPrice)
  });
  
})
// TODO: refactor to use URLSearchParams

// API
// const loadTickers = () => {
//   if (tickersHandlers.size === 0) {
//     return false;
//   }

//   fetch(
//     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(",")}&tsyms=USD&api_key=${API_KEY}`
//   ).then(r => r.json()).then(rawData =>{
//     const updatedPrices = Object.fromEntries(
//     Object.entries(rawData).map(([key, value]) => [key, value.USD])
//     );

//     Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
//       const handlers = tickersHandlers.get(currency) ?? [];
//       handlers.forEach(fn =>  {
//         fn(newPrice)
//       });
//     });
//   });
// };

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message)

  if (socket.readyState === WebSocket.OPEN) { 
    socket.send(stringifiedMessage); 
    return 
  }
  
  socket.addEventListener('open', 
    () => {
    socket.send(stringifiedMessage);
    },
    {once: true}
  );
}

function subscribeToTickerOnWs(ticker, current = 'USD') {
  sendToWebSocket({
    "action": "SubAdd",
    "subs": [`5~CCCAGG~${ticker}~${current}`]
  })
}

function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    "action": "SubRemove",
    "subs": [`5~CCCAGG~${ticker}~USD`]
  })
}

export function deleteTikerToBTC(tickerName) {
  console.log(tickerName);
  
  const index = listCourseTikerToBTC.indexOf(tickerName);
  if (index !== -1) {
    listCourseTikerToBTC.splice(index, 1)
  }
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb])
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker)
  unsubscribeFromTickerOnWs(ticker)
}

// API
// setInterval(loadTickers, 5000);




window.tickersHandlers = tickersHandlers

export const loadCryptoBase = () => 
  fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  ).then(r => r.json());
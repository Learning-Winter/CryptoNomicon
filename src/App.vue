<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="!isDataLoaded"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div v-else class="container">
      <add-ticker
        @add-ticker="add"
        @add-ticker-hint="addCryptoHint"
        :isCryptoData="isCryptoData"
        :disabled="tooManyTickersAdded"
        :isEnableError="isEnableError"
      />
      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <button
            @click="page = page - 1"
            v-show="page > 1"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <button
            @click="page = page + 1"
            v-show="hasNextPage"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперед
          </button>
          <div>Фильтр: <input v-model="filter"/></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="(item, idx) of paginatedTickers"
            :key="idx"
            @click="select(item)"
            :class="{
              'border-4': selectedTicker === item ? 'border-4' : '',
              'bg-red-100': getListUndefined.includes(item.name),
              'bg-white': !getListUndefined.includes(item.name),
            }"
            class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ item.name }} - {{ !getlistCourseTikerToBTC.includes(item.name) ? 'USD' : 'BTC'}}
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(item.price, item.name) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="handlerDelete(item)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <add-graph 
        v-if="selectedTicker" 
        :selectedTicker="selectedTicker" 
        :graph="graph"
        @update-max-graph="updateMaxGraphElements"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTicker, unsubscribeFromTicker, loadCryptoBase, deleteTikerToBTC, listUndefinedTickers, listCourseTikerToBTC } from "./api.js";
import AddGraph from './components/addGraph.vue';
import AddTicker from './components/AddTicker.vue';


export default {
  components: { AddTicker, AddGraph },
  name: "App",

  data() {
    return {
      ticker: "",
      filter: "",
      rateBTC: null,

      tickers: [],
      selectedTicker: null,

      graph: [],
      maxGraphElements: 1,

      
      page: 1,

      isCryptoData: null,
      isDataLoaded: false,
      isEnableError: false,
    };
  },
  created() {
    const windowData = Object.fromEntries(new URL(window.location).searchParams.entries())

    const VALID_KEYS = ["filter", "page"]

    VALID_KEYS.forEach(key => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });

    const tickersData = localStorage.getItem("cryptonomicon-list");
    this.loadedCryptoData();

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);

      this.tickers.forEach(ticker => {
        subscribeToTicker(ticker.name, newPrice => 
          this.updateTicker(ticker.name, newPrice)
      );
      });
    }

    setInterval(this.updateTickers, 5000);
  },
  computed: {
    startIndex(){
      return (this.page - 1) * 6;
    },
    endIndex(){
      return this.page * 6
    },
    filteredTickers() {
      return this.tickers
        .filter((ticker) => ticker.name.includes(this.filter))

    },
    paginatedTickers(){  
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },
    hasNextPage(){
      return this.filteredTickers.length > this.endIndex
    },
    normalizedGraph() {
      const maxValue = Math.max(...this.graph);
      const minValue = Math.min(...this.graph);
      if (maxValue === minValue) {
        return this.graph.map(() => 50)
      }
      return this.graph.map(
        (price) => 5 + ((price - minValue) * 95) / (maxValue - minValue)
      );
    },
    pageStateOptions(){
      return {
        filter: this.filter,
        page: this.page
      }
    },
    getListUndefined(){
      return listUndefinedTickers
    },
    getlistCourseTikerToBTC(){
      return listCourseTikerToBTC
    },
    tooManyTickersAdded() {
      return this.tickers.length > 10;
    }
  },
  methods: {
    updateMaxGraphElements(value){
      this.maxGraphElements = value
    },
    formatPrice(price, name){
      let numberPrice = Number(price)
      if (!numberPrice) {
        return "-"
      }
      
      if (listCourseTikerToBTC.includes(name)){
        numberPrice *= this.rateBTC
      }

      return numberPrice > 1 ? numberPrice.toFixed(2) 
      : numberPrice.toPrecision(2)
    },
    add(ticker) {
      if (this.tickers.some((item) => item.name === ticker.toUpperCase())) {
        this.isEnableError = true;
        return;
      }
      let currentTicker = {
        name: ticker.toUpperCase(),
        price: "-",
      };
      
      this.tickers = [...this.tickers, currentTicker];
      this.filter = "";
      subscribeToTicker(currentTicker.name, newPrice => 
        this.updateTicker(currentTicker.name, newPrice)
      );

    },
    handlerDelete(tickerToRemove) {      
      this.tickers = this.tickers.filter((t) => t != tickerToRemove);

      if (this.selectedTicker === tickerToRemove) {
        this.selectedTicker = null
      }
      unsubscribeFromTicker(tickerToRemove.name)
      deleteTikerToBTC(tickerToRemove.name)
    },
    select(ticker) {
      this.selectedTicker = ticker;
    },
    addCryptoHint(cryptoHint) {
      this.isEnableError = false;
      this.ticker = cryptoHint;
      
      this.add(cryptoHint);
    },
    updateTicker(tickerName, price){
      this.tickers.filter(t => t.name === tickerName).forEach(t => 
        {
          if (t === this.selectedTicker){
            this.graph.push(price)
            while (this.graph.length > this.maxGraphElements){
              this.graph.shift();
            }
          }
          t.price = price
        }
      );
    },
    async loadedCryptoData() {
      this.isCryptoData = await loadCryptoBase();
      this.isDataLoaded = true;
    },
    deleteTikerToBTC(tickerName) {
      const index = listCourseTikerToBTC.indexOf(tickerName);
      if (index !== -1) {
        listCourseTikerToBTC.splice(index, 1)
      }
    }
  },
  watch: {
    selectedTicker(){
      this.graph = [];
      this.$nextTick().then(this.calculatMaxGraphElements)      
    },
    paginatedTickers(){
      if (this.paginatedTickers.length === 0 && this.page > 1){
        this.page -= 1;
      }
    },
    tickers(){
      localStorage.setItem("cryptonomicon-list", JSON.stringify(this.tickers));
    },
    filter(){
      this.page = 1;
    },
    pageStateOptions(value){
      window.history.pushState(
        null, 
        document.title, 
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      )
    },
  },
};
</script>

<style src="./app.css"></style>

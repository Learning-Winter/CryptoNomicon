<template>
  <div>
    <section>
      <div class="flex">
        <div class="max-w-xs">
          <label for="wallet" class="block text-sm font-medium text-gray-700">Тикер</label>
          <div class="mt-1 relative rounded-md shadow-md">
            <input v-model="ticker" @input="handlerInput" @keydown.enter="add" type="text" name="wallet" id="wallet"
              class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              placeholder="Например DOGE" />
          </div>
          <div v-if="isCryptoHints" class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
            <span v-for="(cryptoHint, inx) in isCryptoHints" @click="addCryptoHint(cryptoHint.Symbol)"
              class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
              :key="inx">
              {{ cryptoHint.Symbol }}
            </span>
          </div>
          <div v-if="isEnableError" class="text-sm text-red-600">
            Такой тикер уже добавлен
          </div>
        </div>
      </div>
      <add-button 
        @click="add" 
        :disabled="disabled"
        class="my-4" 
      />
    </section>
  </div>
</template>

<script>
import AddButton from './AddButton.vue';
export default {
  components: { AddButton },
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    isEnableError: {
      type: Boolean,
      required: false,
      default: false,
    },
    isCryptoData: {
      type: Object,
      required: false,
    }
  },
  emits: {
    'add-ticker':  value => typeof value === "string" && value.length > 0,
    'add-ticker-hint': value => typeof value === "string" && value.length > 0
  },
  data() {
    return {
      ticker: '',
      isCryptoHints: null,
    }
  },
  methods: {
    add() {
      if (this.ticker.length === 0){
        return
      }
      this.$emit('add-ticker', this.ticker)
      this.ticker = ""
    },
    handlerInput() {
      if (!this.ticker || this.ticker === " ") {
        this.isCryptoHints = null;
        return;
      }
      let listValue = Object.values(JSON.parse(JSON.stringify(this.isCryptoData.Data)));
      this.isCryptoHints = listValue
        .filter((item) => item.Symbol.includes(this.ticker.toUpperCase()))
        .splice(0, 4);
    },
    addCryptoHint(tickerName){
      this.$emit('add-ticker-hint', tickerName)
    }
  },
}
</script>

<style lang="scss" scoped></style>
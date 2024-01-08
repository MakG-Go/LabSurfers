import { createStore } from 'vuex'
import loader from "@/store/loader"

const store = {
    modules: { loader },

    strict: process.env.NODE_ENV !== 'production'
}

export default createStore(store)
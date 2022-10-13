import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Cluster, Commitment } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import { DEFAULT_COMMITMENT, DEFAULT_CONFIRM_TIMEOUT, DEFAULT_ENDPOINT, ENDPOINTS } from '@/config'

export const useConnectionStore = defineStore({
  id: 'connection',
  state: () => ({
    commitment: DEFAULT_COMMITMENT,
    confirmTransactionInitialTimeout: DEFAULT_CONFIRM_TIMEOUT,
    rpc: useStorage<string>('rpc', ''),
  }),
  getters: {
    endpoint(state) {
      return ENDPOINTS.find(e => e.id === state.rpc) ?? DEFAULT_ENDPOINT
    },
    connection(state): Connection {
      console.log('[connection]', this.endpoint.url)
      return new Connection(this.endpoint.url, {
        confirmTransactionInitialTimeout: state.confirmTransactionInitialTimeout,
        commitment: state.commitment,
        // fetchMiddleware: this.endpoint.getToken
        //   ? tokenAuthFetchMiddleware({
        //     tokenExpiry: 5 * 60 * 1000, // 5 min
        //     getToken: this.endpoint.getToken,
        //   })
        //   : undefined,
      })
    },
    cluster(): ExtendedCluster {
      return this.endpoint.cluster
    },
  },
  actions: {
    setRpc(rpc: string) {
      this.rpc = rpc
    },
    setCommitment(commitment: Commitment) {
      this.commitment = commitment
    },
  },
})

export type ExtendedCluster = Cluster | 'localnet'

export interface Endpoint {
  id: string
  name: string
  cluster: ExtendedCluster
  url: string
  getToken?: () => Promise<string>
}

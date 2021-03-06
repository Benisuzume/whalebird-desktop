import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import { ipcMain } from '~/spec/mock/electron'
import General from '@/store/Preferences/General'

const state = {
  general: {
    sound: {
      fav_rb: true,
      toot: true
    }
  },
  loading: false
}

const Preferences = {
  namespaced: true,
  state: state,
  actions: General.actions,
  mutations: General.mutations
}

describe('Preferences/General', () => {
  let store
  let localVue

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    store = new Vuex.Store({
      modules: {
        Preferences
      }
    })
  })

  describe('loadGeneral', () => {
    beforeEach(() => {
      ipcMain.once('get-preferences', (event, _) => {
        event.sender.send('response-get-preferences', {
          general: {
            sound: {
              fav_rb: false,
              toot: false
            }
          }
        })
      })
    })
    it('should be updated', async () => {
      await store.dispatch('Preferences/loadGeneral')
      expect(store.state.Preferences.general.sound.fav_rb).toEqual(false)
      expect(store.state.Preferences.general.sound.toot).toEqual(false)
      expect(store.state.Preferences.loading).toEqual(false)
    })
  })

  describe('updateSound', () => {
    beforeEach(() => {
      ipcMain.once('update-preferences', (event, config) => {
        event.sender.send('response-update-preferences', config)
      })
    })
    it('should be updated', async () => {
      await store.dispatch('Preferences/updateSound', {
        fav_rb: false,
        toot: false
      })
      expect(store.state.Preferences.general.sound.fav_rb).toEqual(false)
      expect(store.state.Preferences.general.sound.toot).toEqual(false)
      expect(store.state.Preferences.loading).toEqual(false)
    })
  })
})

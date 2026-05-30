import { defineStore } from 'pinia'
import { ref } from 'vue'
import { spatialAudio } from '@/services/rtc/spatial-audio'

export const useSettingsStore = defineStore('settings', () => {
  const spatialAudioEnabled = ref(false)
  const inputVolume = ref(100)
  const outputVolume = ref(100)
  const noiseSuppressionEnabled = ref(true)
  const messageNotifications = ref(true)

  function toggleSpatialAudio() {
    spatialAudioEnabled.value = !spatialAudioEnabled.value
    if (spatialAudioEnabled.value) {
      spatialAudio.enable()
    } else {
      spatialAudio.disable()
    }
  }

  return {
    spatialAudioEnabled, inputVolume, outputVolume,
    noiseSuppressionEnabled, messageNotifications,
    toggleSpatialAudio,
  }
})

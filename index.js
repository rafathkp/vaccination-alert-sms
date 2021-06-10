import got from 'got'
import fast2sms from 'fast-two-sms'

const mainUrl = 'https://cdn-api.co-vin.in/api/'
const YOUR_API_KEY =
  'KYukiM6FPten2ZgrzAw7vJlp4j50IH8RCUbQadXNG1oDq3fOmBHn2UgGkFD6Ld73eCcJs1XiNqzfAPKB'

let currentDateSplitted = new Date().toLocaleDateString().split('/')

const apiFetcher = async () => {
  try {
    const resp = await got.get(
      `${mainUrl}v2/appointment/sessions/public/calendarByDistrict?district_id=305&date=${currentDateSplitted[0]}-${currentDateSplitted[1]}-${currentDateSplitted[2]}`
    )
    return JSON.parse(resp.body)
  } catch (err) {
    return err.message
  }
}

const sendSMS = async (message) => {
  try {
    if (message) {
      console.log('GOING TO SENDING SMS')
      let MessageTemplate = ` ***** ALERT ***** \n VACCINES ARE AVAILABLE \n Please Register \n ******* RAFATH ****** `
      let options = {
        authorization: YOUR_API_KEY,
        message: MessageTemplate,
        numbers: ['9074982388']
      }
      const response = await fast2sms.sendMessage(options)
      console.log(response)
      console.log('ALERT SENDED')
    }
  } catch (err) {
    console.log(err.message)
  }
}

let slotFinder = async () => {
  console.log('EXECUTION GOING ON')
  try {
    let arrMainData = []
    let data = await apiFetcher()
    data = data['centers']
    let FreeFilter = data.filter((block) => block.fee_type === 'Free')
    let blockFilter = FreeFilter.filter(
      (block) =>
        block.block_name === 'Kozhikode Corporation' ||
        block.block_name === 'Cheruvannur CHC' ||
        block.block_name === 'Olavanna CHC'
    )
    blockFilter.forEach((element) => {
      element['sessions'].forEach((item) => {
        let objMainData = {
          name: '',
          address: '',
          block: '',
          ageLimit18: false,
          ageLimit40: false,
          ageLimit45: false,
          availableCapacity: 0,
          availableCapacityDose1: false,
          availableCapacityDose2: false
        }
        if (item['vaccine'] === 'COVISHIELD') {
          objMainData['name'] = element['name']
          objMainData['address'] = element['address']
          objMainData['block'] = element['block_name']
          objMainData['availableCapacity'] = item['available_capacity']

          item['available_capacity_dose1'] !== 0
            ? (objMainData['availableCapacityDose1'] = true)
            : false

          item['available_capacity_dose1'] !== 0
            ? (objMainData['availableCapacityDose1'] = true)
            : false

          item['min_age_limit'] === 45
            ? (objMainData['ageLimit45'] = true)
            : false

          item['min_age_limit'] === 40
            ? (objMainData['ageLimit40'] = true)
            : false

          item['min_age_limit'] === 18
            ? (objMainData['ageLimit18'] = true)
            : false

          arrMainData.push(objMainData)
        }
      })
    })

    let messageToUser = arrMainData.filter(
      (doc) =>
        doc['availableCapacity'] !== 0 || doc['availableCapacityDose1'] === true
    )
    if (messageToUser[0]) {
      console.log('FIND VACCINATION SLOTS')
      await sendSMS(messageToUser)
    }
  } catch (err) {
    console.log(err.message)
  }
}

var minutes = 5,
  the_interval = minutes * 60 * 1000
console.log('EXECUTION STARTED')
setInterval(function () {
  slotFinder()
}, 5000)

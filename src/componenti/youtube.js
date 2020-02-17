import searchYoutube from 'youtube-api-v3-search'
import OpenLocationCode from 'open-location-code-typescript'
import { mappaEsterna } from './mappa2'
import { posti } from './azioni'

const YOUTUBE_KEY = 'AIzaSyCiM_SrbJEhuio-wi0mZXI07T-vvZuSGdY'
export var cooClips = []

const options = {
    q:'nodejs',
    part:'snippet',
    type:'video',
    maxResults: 30,
  }


export function cercaYoutube(callback) {
    let olc = OpenLocationCode.encode(mappaEsterna.getCenter().lat,mappaEsterna.getCenter().lng, 6)
    let res = olc.replace("+", "");
    options.q = res
    searchYoutube(YOUTUBE_KEY, options, (error, result) => {
        if (result !== undefined) {
            let olcClips = result.items.map(elemento => elemento.snippet.description.slice(20,31))
            olcClips = olcClips.filter(Boolean)
            cooClips = olcClips.map(a => ({
                geometry : {
                    coordinates: [
                        OpenLocationCode.decode(a).longitudeCenter, 
                        OpenLocationCode.decode(a).latitudeCenter
                    ]
                },
                id : "youtube"
            }))
            cooClips.map(a => posti.unshift(a))
            callback();
        } else {console.log(error)}
        
        }
    )
}
module.exports = {
  getTracklist: (tracklistIn) => {
    const tracks = tracklistIn.map(t => t.dataValues)
    const finalTracklist = []
    let lastPosition = null
    const finalTrack = {
      mainTitle: '',
      position: '',
      mainTracks: []
    }
    const finalSubTrack = {
      subTitle: '',
      subTracks: []
    }

    for (const subtrack of tracks) {
      if (/^subtrack$/i.test(subtrack.type)) {
        finalSubTrack.subTitle = subtrack.subTitle
        delete subtrack.mainTitle
        delete subtrack.subTitle
        finalSubTrack.subTracks.push(JSON.parse(JSON.stringify(subtrack)))
      }
    }

    for (const track of tracks) {
      if (/^track$/i.test(track.type)) {
        if ((finalTrack.position != '' && finalTrack.position != track.position[0])) {
          finalTracklist.push(JSON.parse(JSON.stringify(finalTrack)))
          finalTrack.mainTitle = ''
          finalTrack.mainTracks = []
        }
        if (finalSubTrack.subTracks && finalSubTrack.subTracks.length > 0 && finalSubTrack.subTracks[0].position[0] == track.position[0])
          finalTrack.subTracks = finalSubTrack
        else {
          if (finalTrack.subTracks && finalSubTrack.subTracks[0].position[0].charCodeAt() < track.position[0].charCodeAt())
            delete finalTrack.subTracks
        }

        finalTrack.mainTitle = track.mainTitle
        finalTrack.position = track.position[0]
        delete track.mainTitle
        delete track.subTitle
        lastPosition = track.position

        finalTrack.mainTracks.push(JSON.parse(JSON.stringify(track)))
      }
    }
    finalTracklist.push(JSON.parse(JSON.stringify(finalTrack)))

    return finalTracklist
  }
}
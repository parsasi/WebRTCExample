class VideoRTC{
    peerConnection;
    remoteStream;
    constructor( options , configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}){
        this.peerConnection = new RTCPeerConnection(configuration)
        this.getUserMedia = options.getUserMedia
        this.setRemoteMedia = options.setRemoteMedia
        this.onIceCandidate = options.onIceCandidate
    }

    async configStreams(){
        this.localStream = await this.getUserMedia()
        this.remoteStream = new MediaStream();
        this.trackEventListener()
        this.iceCandidateEventListener()
        this.stateChangeEventListener()
    }

    async makeOffer(){
        this.peerConnection.addStream(this.localStream)
        const offer = await this.peerConnection.createOffer({
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo : true
            }
        });
        await this.peerConnection.setLocalDescription(offer)
        return offer
    }

    async recieveOffer(offer){
        const remoteOffer = new RTCSessionDescription(offer)
        this.peerConnection.setRemoteDescription(remoteOffer)
        // this.peerConnection.addStream(this.localStream)
        return await this.answerOffer()
    }

    async answerOffer(){
        const answer = await this.peerConnection.createAnswer({ mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo : true
        }});
        await this.peerConnection.setLocalDescription(answer)
        return answer
    }

    async recieveAnswer(answer){
        const remoteSingal = new RTCSessionDescription(answer)
        // peerConnection.addStream(await getUserMedia())
        await this.peerConnection.setRemoteDescription(remoteSingal)
    }

    async remoteIceRecieved(iceCandidate){
        await this.peerConnection.addIceCandidate(iceCandidate);
    }

    async stateChangeEventListener(){
        this.peerConnection.addEventListener('connectionstatechange', async event => {
            if (this.peerConnection.connectionState === 'connected') {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                })
            }
        })
    }

    async trackEventListener(){
        this.peerConnection.addEventListener('track' , async event => {
            console.log('RTC: A track is recieved from the other party')
            this.remoteStream.addTrack(event.track , this.remoteStream)
            this.setRemoteMedia(this.remoteStream)

        })
    }

    async iceCandidateEventListener(){
        this.peerConnection.addEventListener('icecandidate' , event => {
            if(event.candidate){
                this.onIceCandidate(event.candidate)
            }
        })
    }
    
}

const socket = io.connect('localhost:8081');
console.log(socket)

const localVideo = document.querySelector('#local')
const remoteVideo = document.querySelector('#remote')
const startVideo = document.querySelector('#startVideo')
const startCall = document.querySelector('#startCall')



let localStream


socket.on('connect', function() {

    async function getUserMedia(){
        return await navigator.mediaDevices.getUserMedia({video : true})
    }
    
    function setRemoteMedia(stream){
        remoteVideo.srcObject = stream
    }
    
    function onIceCandidate(candidate){
        socket.emit('new-ice-candidate',  candidate);
    }

    const rtc = new VideoRTC({getUserMedia , setRemoteMedia , onIceCandidate})
    rtc.configStreams()
    startVideo.addEventListener('click' ,  setLocalStream)
    startCall.addEventListener('click' , makeOffer)


    async function makeOffer(){
        console.log('Caller creates an offer')
        const offer = await rtc.makeOffer()
        socket.emit('call' , offer)
    }

    socket.on('offer' , async offer => {
        console.log('Callee recieves the offer')
        const answer = await rtc.recieveOffer(offer)
        socket.emit('answer' , answer)
    })

    socket.on('answer' , async answer => {
        console.log('Caller recieves the answer')
        await rtc.recieveAnswer(answer)
    })

    socket.on('new-ice-candidate' , async iceCandidate => {
        console.log('Socket: the other party has recieved an ice candaidate')
        try {
            await rtc.remoteIceRecieved(iceCandidate)
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    })
   

    async function setLocalStream(){
        const stream = await getUserMedia()
        localStream = stream
        localVideo.srcObject = stream 
    }

});


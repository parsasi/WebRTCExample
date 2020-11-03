export default class VideoRTC{
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
        const offer = await this.peerConnection.createOffer();
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
        const answer = await this.peerConnection.createAnswer();
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
                    console.log('sending tracks to remote')
                    // this.peerConnection.addTrack(track, this.localStream);

                    //THIS IS WHERE I MESSED UP 
                    //this.remoteStream is set in track event listener and assigned to the video element here WRONG!!!
                    this.setRemoteMedia(this.remoteStream)
                })
            }
        })
    }

    async trackEventListener(){
        this.peerConnection.addEventListener('track' , async event => {
            console.log('remote track recieved')
            // console.log('RTC: A track is recieved from the other party')
            this.remoteStream.addTrack(event.track , this.remoteStream)
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
var socket = io.connect('localhost:8081');
const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
let peerConnection = new RTCPeerConnection(configuration)


const localVideo = document.querySelector('#local')
const remoteVideo = document.querySelector('#remote')
const startVideo = document.querySelector('#startVideo')
const startCall = document.querySelector('#startCall')



let localStream
let remoteStream = new MediaStream();




let id
socket.on('connect', function(data) {

    startVideo.addEventListener('click' ,  setLocalStream)
    startCall.addEventListener('click' , makeCall)

    socket.on('offer' , async signal => {
        console.log('Callee recieves the offer')
        const remoteSingal = new RTCSessionDescription(signal)
        peerConnection.setRemoteDescription(remoteSingal)
        peerConnection.addStream(await getUserMedia())
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer)
        socket.emit('answer' , answer)
    })

    socket.on('answer' , async signal => {
        console.log('Caller recieves the answer')
        const remoteSingal = new RTCSessionDescription(signal)
        peerConnection.addStream(await getUserMedia())
        peerConnection.setRemoteDescription(remoteSingal)
    })

    socket.on('new-ice-candidate' , async data => {
        console.log('Socket: the other party has recieved an ice candaidate')
        try {
            await peerConnection.addIceCandidate(data);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    })


    async function makeCall(){
        console.log('Caller creates an offer')
        peerConnection.addStream(await getUserMedia())
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer)
        socket.emit('call' , offer)
    }

    peerConnection.onicecandidate = event => {
        console.log('ice candidate event')  
        if (event.candidate) {
            socket.emit('new-ice-candidate',  event.candidate);
        }
    };


    async function getUserMedia(){
        return await navigator.mediaDevices.getUserMedia({video : true})
    }

    async function setLocalStream(){
        const stream = await getUserMedia()
        localStream = stream
        localVideo.srcObject = stream 
    }

    peerConnection.addEventListener('connectionstatechange',async event => {
        if (peerConnection.connectionState === 'connected') {
            await setLocalStream()
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
                remoteVideo.srcObject = remoteStream
            })
        }
    })

    peerConnection.addEventListener('track' , async event => {
        console.log('RTC: A track is recieved from the other party')
        remoteStream.addTrack(event.track , remoteStream)
    })

    

});


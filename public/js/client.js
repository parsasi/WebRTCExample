
import VideoRTC from './rtc.js'


const socket = io.connect('192.168.1.176:8081');

const localVideo = document.querySelector('#local')
const remoteVideo = document.querySelector('#remote')
const startVideo = document.querySelector('#startVideo')
const startCall = document.querySelector('#startCall')



let localStream



socket.on('connect', function(data) {


    let rtc

    startVideo.addEventListener('click' ,  setLocalStream)
    startCall.addEventListener('click' , makeOffer)

    async function initiateRTC(){
        rtc = new VideoRTC({getUserMedia , setRemoteMedia , onIceCandidate})
        await rtc.configStreams()
    }

    async function getUserMedia(){
        return await navigator.mediaDevices.getUserMedia({video : true})
    }
    
    function setRemoteMedia(stream){
        remoteVideo.srcObject = stream
    }
    
    function onIceCandidate(candidate){
        socket.emit('new-ice-candidate',  candidate);
    }
    
    
    async function makeOffer(){
        await initiateRTC()
        console.log('Caller creates an offer')
        const offer = await rtc.makeOffer()
        socket.emit('call' , offer)
    }

    socket.on('offer' , async offer => {
        await initiateRTC()
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


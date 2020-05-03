
(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.PeerCall = factory();
    }
}(this, function() {

    return function(id, socket, iceServers, iceCandidatePoolSize){
        this.id = id;
        this.connection = null;
        this.socket = socket;
    
        this.peerconfig = {
            iceServers: iceServers,
            iceCandidatePoolSize: iceCandidatePoolSize
        };
    
        var self = this;
    
        this.init = function(localStream, callback){
            this.connection = new webrtcsupport.PeerConnection(this.peerconfig);
            
            // Debugging events
            this.connection.addEventListener("icegatheringstatechange", function (e) {
                console.log(self.id, "icegatheringstatechange: ", self.connection.iceGatheringState, e);
            });
            this.connection.addEventListener("connectionstatechange", function (e) {
                console.log(self.id, "connectionstatechange: ", self.connection.connectionState, e);
            });
            this.connection.addEventListener("signalingstatechange", function (e) {
                console.log(self.id, "signalingstatechange: ", self.connection.signalingState, e);
            });
            this.connection.addEventListener("iceconnectionstatechange", function (e) {
                console.log(self.id, "iceconnectionstatechange: ", self.connection.iceConnectionState, e);
            });
            
            localStream.getTracks().forEach(function(track){
                self.connection.addTrack(track, localStream);
            });
    
            var remoteStream = new MediaStream();
            this.connection.addEventListener('track', function (event) {
                event.streams[0].getTracks().forEach(function(track){
                    console.log(self.id, 'Add a track to the remoteStream:', track);
                    remoteStream.addTrack(track);
                });
            });
            callback(this.id, remoteStream);
    
            this.connection.addEventListener('icecandidate', function(e){
                if(e.candidate){
                    self.socket.emit("candidate", self.id, e.candidate);
                }
            });
    
        }
    
        this.offer = async function(){
            var offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
    
            this.socket.emit('offer', this.id, offer);
        }
    
        this.answer = async function(offer){
            await this.connection.setRemoteDescription(new webrtcsupport.SessionDescription(offer));
            var answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);
    
            this.socket.emit("answer", this.id, {
                type: answer.type,
                sdp: answer.sdp
            });
        }
    
        this.stablish = async function(answer){
            const rtcSessionDescription = new webrtcsupport.SessionDescription(answer);
            await this.connection.setRemoteDescription(rtcSessionDescription);
        }
    
        this.candidate = function(candidate){
            this.connection.addIceCandidate(new webrtcsupport.IceCandidate(candidate));
        }
    
        this.close = function(callback){
            this.connection.close();
            callback(this.id);
        }
    
    };

}));

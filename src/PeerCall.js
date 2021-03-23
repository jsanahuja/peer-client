import adapter from "webrtc-adapter";

var PeerCall = function (id, socket, iceServers, iceCandidatePoolSize) {
    this.id = id;
    this.connection = null;
    this.socket = socket;

    this.peerconfig = {
        iceServers: iceServers,
        iceCandidatePoolSize: iceCandidatePoolSize
    };

    var self = this;

    this.init = function (localStream, callback) {
        this.connection = new window.RTCPeerConnection(this.peerconfig);

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

        localStream.getTracks().forEach(function (track) {
            console.log(self.id, "local track: ", track);
            self.connection.addTrack(track, localStream);
        });

        this.remoteStream = new MediaStream();
        this.connection.addEventListener('track', function(event) {
            event.streams[0].getTracks().forEach(function (track) {
                console.log(self.id, "remote track: ", track);
                self.remoteStream.addTrack(track);
            });
            // This should be outside the event but need here for Safari compatibility
            callback(self.id, self.remoteStream);
        });

        this.connection.addEventListener('icecandidate', function (e) {
            if (e.candidate) {
                self.socket.emit("candidate", self.id, e.candidate);
            }
        });
    }

    this.offer = async function () {
        var offer = await this.connection.createOffer();
        this.socket.emit('offer', this.id, offer);
        await this.connection.setLocalDescription(offer);
    }

    this.answer = async function (offer) {
        await this.connection.setRemoteDescription(new window.RTCSessionDescription(offer));
        var answer = await this.connection.createAnswer();
        this.socket.emit("answer", this.id, {
            type: answer.type,
            sdp: answer.sdp
        });
        await this.connection.setLocalDescription(answer);
    }

    this.stablish = async function (answer) {
        const rtcSessionDescription = new window.RTCSessionDescription(answer);
        await this.connection.setRemoteDescription(rtcSessionDescription);
    }

    this.candidate = function (candidate) {
        this.connection.addIceCandidate(new window.RTCIceCandidate(candidate));
    }

    this.close = function (callback) {
        this.connection.close();
        callback(this.id);
    }

};

export default PeerCall;

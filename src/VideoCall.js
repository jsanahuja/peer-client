(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.VideoCall = factory();
    }
}(this, function () {
    return function (id, iceServers, iceCandidatePoolSize) {
        this.id = id;
        this.connection = null;
        this.peerconfig = {
            iceServers: iceServers,
            iceCandidatePoolSize: iceCandidatePoolSize
        };

        var self = this;

        this.init = function (stream, onIceCandidate, onRemoteStream) {
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

            if (typeof stream !== "undefined" && stream !== null) {
                stream.getTracks().forEach(function (track) {
                    self.connection.addTrack(track, stream);
                });
            }

            if (typeof onRemoteStream !== "undefined") {
                var remoteStream = new MediaStream();
                this.connection.addEventListener('track', function (event) {
                    event.streams[0].getTracks().forEach(function (track) {
                        remoteStream.addTrack(track);
                    });
                });
                onRemoteStream(self.id, remoteStream);
            }

            this.connection.addEventListener('icecandidate', function (e) {
                if (e.candidate) {
                    onIceCandidate(self.id, e.candidate);
                }
            });
        }

        this.getOffer = async function () {
            if (this.connection === null) {
                return false;
            }
            var offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
            return offer;
        }

        this.getAnswer = async function (offer) {
            if (this.connection === null) {
                return false;
            }
            await this.connection.setRemoteDescription(
                new webrtcsupport.SessionDescription(offer)
            );
            var answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);
            return answer;
        }

        this.setAnswer = async function (answer) {
            if (this.connection === null) {
                return false;
            }
            await this.connection.setRemoteDescription(
                new webrtcsupport.SessionDescription(answer)
            );
            return true;
        }

        this.setCandidate = function (candidate) {
            if (this.connection === null) {
                return false;
            }
            this.connection.addIceCandidate(new webrtcsupport.IceCandidate(candidate));
            return true;
        }

        this.close = function (callback) {
            if (this.connection === null) {
                return false;
            }
            this.connection.close();
            callback(this.id);
            return true;
        }
    }
}));
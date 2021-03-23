import PeerCall from './PeerCall.js';

var PeerClient = function(config) {
    this.connected = false;
    this.config = config;
    this.socket = null;

    this.localStream = null;
    this.connections = {};

    this.config.onUpdateStreamOptions(this.config.streamOptions);

    if(!!window.RTCPeerConnection && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)){
        console.log("This browser seems to support WebRTC");
    }else{
        this.config.onUnsupportedWebRTC();
    }

    var self = this;

    this.buildClientEvent = function(type, room){
        this.config.onUserEvent({
            type: type,
            room: room
        });
    }

    this.buildRoomEvent = function(type, client, data){
        this.config.onRoomEvent({
            type: type,
            client: client,
            data: data
        });
    }

    this.initSocket = function () {
        this.socket = io(config.server);
        this.socket.on('connect', function () {
            if(self.connected){
               alert("Server connection error. Please try again...");
               location.reload();
            }else{
                self.connected = true;
                console.log("Connected IO:", self.socket.id);
            }
        });

        /**
         * Call related
         */
        this.socket.on('call', function(callId){
            console.log("CALL", callId);
            self.connections[callId] = new PeerCall(
                callId, self.socket, 
                self.config.iceServers,
                self.config.iceCandidatePoolSize
            );
            self.connections[callId].init(self.localStream, self.config.onRemoteStreamStart);
            self.connections[callId].offer();
        });
        
        this.socket.on('offer', function(callId, offer){
            console.log("OFFER", callId, offer);
            self.connections[callId] = new PeerCall(
                callId, self.socket, 
                self.config.iceServers,
                self.config.iceCandidatePoolSize
            );
            self.connections[callId].init(self.localStream, self.config.onRemoteStreamStart);
            self.connections[callId].answer(offer);
        });

        this.socket.on('answer', function(callId, answer){
            console.log("ANSWER", callId, answer);
            self.connections[callId].stablish(answer);
        });

        this.socket.on('hangup', function(callId){
            console.log("HANGUP", callId);
            self.connections[callId].close(self.config.onRemoteStreamClose);
        });

        this.socket.on('candidate', function(callId, candidate){
            console.log("CANDIDATE", callId);
            self.connections[callId].candidate(candidate);
        });
        
        /**
         * Local client Events
         */
        this.socket.on('created', function(room){
            self.buildClientEvent("created", room);
        });
        this.socket.on('joined', function(room){
            self.buildClientEvent("joined", room);
        });
        this.socket.on('left', function(room){
            self.buildClientEvent("left", room);
        });
        this.socket.on('kicked', function(room){
            self.buildClientEvent("kicked", room);
        });
        this.socket.on('banned', function(room){
            self.buildClientEvent("banned", room);
        });
        this.socket.on('unbanned', function(room){
            self.buildClientEvent("unbanned", room);
        });

        /**
         * Room broadcast Events
         */
        this.socket.on('r_resource', function(user, resources){
            self.buildRoomEvent("resource", user, resources);
        });
        this.socket.on('r_message', function(user, message){
            self.buildRoomEvent("message", user, message);
        });
        this.socket.on('r_joined', async function(user){
            self.buildRoomEvent("joined", user);
        });
        this.socket.on('r_left', function(user){
            self.buildRoomEvent("left", user);
        });
        this.socket.on('r_kicked', function(user){
            self.buildRoomEvent("kicked", user);
        });
        this.socket.on('r_banned', function(user){
            self.buildRoomEvent("banned", user);
        });
        this.socket.on('r_unbanned', function(user){
            self.buildRoomEvent("unbanned", user);
        });
    }

    this.initUserMedia = async function () {
        var video = this.config.streamConstraints.video || false,
            audio = this.config.streamConstraints.audio || false,
            error = false,
            stream;
        // Getting UserMedia with streamConstraints
        try{
            stream = await navigator.mediaDevices.getUserMedia({
                video: video,
                audio: audio
            });
        }catch(e){
            // Permission denied.
            // Trying to get only audio.
            try{
                stream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: audio
                });
                // If we are here the problem was video permissions.
                error = "camera";
            }catch(e){
                // Permission denied.
                // Trying to get only video
                try{
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: video,
                        audio: false
                    });
                    // If we are here the problem was audio permissions.
                    error = "microphone";
                }catch(e){
                    console.error(e);
                    // Permission denied. If we are here both failed.
                    error = "both";
                }
            }
        }
        // Applying streamOptions right after getting UserMedia
        if(error !== false){
            this.config.onPermissionDenied(error);
            // If both failed makes no to continue.
            if(error == "both"){
                return;
            }
        }
        this.updateUserMedia();

        this.localStream = stream;
        this.config.onLocalStream(stream);
    }

    this.updateUserMedia = function(){
        if(this.localStream !== null){
            if(typeof this.localStream.getVideoTracks !== "undefined"){
                var videoTracks = this.localStream.getVideoTracks();
                if(typeof videoTracks[0] !== "undefined"){
                    videoTracks[0].enabled = this.config.streamOptions.video;
                }
            }
            if(typeof this.localStream.getAudioTracks !== "undefined"){
                var audioTracks = this.localStream.getAudioTracks();
                if(typeof audioTracks[0] !== "undefined"){
                    audioTracks[0].enabled = this.config.streamOptions.microphone;
                }
            }
            // @TODO: Enable / disable remote audio
        }
        var keys = Object.keys(this.connections);
        for(var i = 0; i < keys.length; i++){
            if(
                typeof this.connections[keys[i]] !== "undefined" && 
                typeof this.connections[keys[i]].remoteStream !== "undefined" &&
                typeof this.connections[keys[i]].remoteStream.getAudioTracks !== "undefined"
            ){
                var audioTracks = this.connections[keys[i]].remoteStream.getAudioTracks();
                if(typeof audioTracks[0] !== "undefined"){
                    audioTracks[0].enabled = this.config.streamOptions.audio;
                }
            }
        }
        this.config.onUpdateStreamOptions(this.config.streamOptions);
    }

    /**
     * Stream actions
     */
    this.toggleCam = function(){
        this.socket.emit("toggle", "video");
        this.config.streamOptions.video = !this.config.streamOptions.video;
        this.updateUserMedia();
    }

    this.toggleMicrophone = function(){
        this.socket.emit("toggle", "microphone");
        this.config.streamOptions.microphone = !this.config.streamOptions.microphone;
        this.updateUserMedia();
    }

    this.toggleAudio = function(){
        this.socket.emit("toggle", "audio");
        this.config.streamOptions.audio = !this.config.streamOptions.audio;
        this.updateUserMedia();
    }

    /**
     * Room actions
     */
    this.createRoom = function (name, password) {
        this.socket.emit("create", name, password);
    }

    this.joinRoom = function(roomId, password){
        this.socket.emit("join", roomId, password);
    }
    
    this.sendMessage = function(message){
        this.socket.emit("message", message);
    }
};

export default PeerClient;

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.VideoCall = factory();
    }
}(this, function() {
    return function(config) {
        this.id = null;
        this.room = null;
        this.config = config;
        this.videoStream = null;
        this.audioStream = null;
        var self = this;

        if(!webrtcsupport.support || !webrtcsupport.mediaStream){
            self.fireEvent("error_webrtc_nosupport");
        }

        // Helpers
        this.hasRoom = function(){
            return this.room !== null;
        }

        this.isOwner = function(){
            return this.room.owner = this.id;
        }

        this.fireEvent = function(type, data){
            if(typeof this.config.eventsHandler !== "undefined"){
                this.config.eventsHandler(Object.assign(
                    (data || {}), {type: type}
                ));
            }
        }
        
        // actions
        this.toggleCamera = function(){
            if(typeof this.videoStream.getVideoTracks !== "undefined"){
                var videoTracks = this.videoStream.getVideoTracks();
                if(typeof videoTracks[0] !== "undefined"){
                    videoTracks[0].enabled = !videoTracks[0].enabled;
                    this.socket.emit("toggle", {resource: "camera", status: videoTracks[0].enabled});
                    this.fireEvent("toggle_camera", {status: videoTracks[0].enabled});
                    return true;
                }
            }
            this.fireEvent("error_toggle_nocamera");
            return false;
        };

        this.toggleMicrophone = function(){
            if(typeof this.audioStream.getAudioTracks !== "undefined"){
                var audioTracks = this.audioStream.getAudioTracks();
                if(typeof audioTracks[0] !== "undefined"){
                    audioTracks[0].enabled = !audioTracks[0].enabled;
                    this.socket.emit("toggle", {resource: "microphone", status: audioTracks[0].enabled});
                    this.fireEvent("toggle_microphone", {status: audioTracks[0].enabled});
                    return true;
                }
            }
            this.fireEvent("error_toggle_nomicrophone");
            return false;
        };

        this.toggleAudio = function(){
            this.fireEvent("toggle_microphone", {status: audioTracks[0].enabled});
        };

        this.messageRoom = function(message){
            if(!this.hasRoom()){
                this.fireEvent("error_message_noroom");
                return false;
            }
            this.socket.emit("message", message);
        }

        this.createRoom = function(name, password){
            if(this.hasRoom()){
                this.fireEvent("error_create_alreadyinaroom");
                return false;
            }
            this.socket.emit("create", name, password);
        };

        this.joinRoom = function(roomId, password){
            if(this.hasRoom()){
                this.fireEvent("error_join_alreadyinaroom");
                return false;
            }
            this.socket.emit("join", roomId, password);
        };

        this.leaveRoom = function(){
            if(!this.hasRoom()){
                this.fireEvent("error_leave_noroom");
                return false;
            }
            this.socket.emit("leave");
        };

        this.kickFromRoom = function(clientId){
            if(!this.isOwner){
                this.fireEvent("error_kick_notallowed");
                return false;
            }
            this.socket.emit("kick", clientId);
        };

        this.banFromRoom = function(clientId){
            if(!this.isOwner){
                this.fireEvent("error_ban_notallowed");
                return false;
            }
            this.socket.emit("ban", clientId);
        };

        this.unbanFromRoom = function(clientId){
            if(!this.isOwner){
                this.fireEvent("error_unban_notallowed");
                return false;
            }
            this.socket.emit("unban", clientId);
        };

        this.initMedia = async function(){
            try{
                this.videoStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                this.audioStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                
                this.fireEvent("local_media", {stream: this.videoStream});
            }catch(e){
                this.fireEvent("error_media_nopermission", {error: e});
            }
        };

        this.initSocket = function(){
            // Binding socket
            this.socket = io(config.server);
            this.socket.on('connect', function () {
                self.fireEvent("local_ready");
            });

            // Local client events
            this.socket.on('created', function(room){
                self.fireEvent("local_created", {room: room});
            });
            this.socket.on('joined', function(room){
                self.fireEvent("local_joined", {room: room});
            });
            this.socket.on('left', function(room){
                self.fireEvent("local_left", {room: room});
            });
            this.socket.on('kicked', function(room){
                self.fireEvent("local_kicked", {room: room});
            });
            this.socket.on('banned', function(room){
                self.fireEvent("local_banned", {room: room});
            });
            this.socket.on('unbanned', function(room){
                self.fireEvent("local_unbanned", {room: room});
            });

            // Room events
            this.socket.on('r_message', function(user, message){
                self.fireEvent("remote_message", {user: user, message: message});
            });
            this.socket.on('r_joined', async function(user){
                self.fireEvent("remote_joined", {user: user});
            });
            this.socket.on('r_left', function(user){
                self.fireEvent("remote_left", {user: user});
            });
            this.socket.on('r_kicked', function(user){
                self.fireEvent("remote_kicked", {user: user});
            });
            this.socket.on('r_banned', function(user){
                self.fireEvent("remote_banned", {user: user});
            });
            this.socket.on('r_unbanned', function(user){
                self.fireEvent("remote_unbanned", {user: user});
            });
        };
    };
}));
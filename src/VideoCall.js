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
        this.config = config;
        this.videoStream = null;
        this.audioStream = null;
        this.id = null;
        this.room = null;
        var self = this;

        // Helpers
        this.hasRoom = function(){
            return this.room !== null;
        }

        this.isOwner = function(){
            return this.room.owner = this.id;
        }

        this.fireEvent = function(type, data){
            if(typeof this.config.eventHandler !== "undefined"){
                this.config.eventHandler(Object.assign(
                    (data || {}), {type: type}
                ));
            }
        }
        
        // Room actions
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
                this.fireEvent("error_kick_nopermission");
                return false;
            }
            this.socket.emit("kick", clientId);
        };

        this.banFromRoom = function(clientId){
            if(!this.isOwner){
                this.fireEvent("error_ban_nopermission");
                return false;
            }
            this.socket.emit("ban", clientId);
        };

        this.unbanFromRoom = function(clientId){
            if(!this.isOwner){
                this.fireEvent("error_ban_nopermission");
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
                if(typeof this.config.onPermissionDenied !== "undefined"){
                    this.config.onPermissionDenied(e);
                }
            }
        };

        this.initSocket = function(){
            // Binding socket
            this.socket = io(config.server);
            this.socket.on('connect', function () {
                console.log("Connected IO:", self.socket.id);
            });

            // Local client events
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

            // Room events
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
        };
    };
}));
const client = new VideoCall({
    server: "https://webrtc.sowecms.com:9000",
    iceServers: [
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
            urls: 'turn:80.211.46.67:3478',
            username: 'sowecms',
            credential: 'GDOWcZL?5R4FiJ'
        }
    ],
    iceCandidatePoolSize: 40,
    onLocalStream: function(stream){
        document.querySelector('video#local').srcObject = stream;
    },
    onRemoteStreamStart: function(callId, stream){
        var video = document.createElement("video");
        video.autoplay = "true";
        video.srcObject = stream;
        video.id = "remote" + callId;
        document.querySelector('#videos').appendChild(video);
    },
    onRemoteStreamClose: function(callId){
        var id = "remote" + callId;
        var video = document.querySelector("#" + id);
        document.querySelector('#videos').removeChild(video);
    },
    onUpdateStreamOptions: function(streamOptions){
        if(streamOptions.video){
            document.querySelector("#toggleCam").innerText = "Disable Cam";
        }else{
            document.querySelector("#toggleCam").innerText = "Enable Cam";
        }

        if(streamOptions.microphone){
            document.querySelector("#toggleMicrophone").innerText = "Disable Microphone";
        }else{
            document.querySelector("#toggleMicrophone").innerText = "Enable Microphone";
        }

        if(streamOptions.audio){
            document.querySelector("#toggleAudio").innerText = "Disable Sound";
        }else{
            document.querySelector("#toggleAudio").innerText = "Enable Sound";
        }
    },
    onPermissionDenied: function(error){
        alert("Permission denied. Error:", error);
    },
    onUnsupportedWebRTC: function(){
        alert("Your browser does not support WebRTC");
    },
    onUserEvent: function(event){
        switch(event.type){
            case "created":
                var url = "https://webrtc.sowecms.com/client/autojoin.html#" + event.room.id + ":" + document.querySelector('#createRoomPassword').value;
                document.querySelector("#roomid").innerHTML = "<a href='" + url +"'>" + url + "</a>";
                break;
            case "joined":
                break;
            case "left":
                break;
            case "kicked":
                break;
            case "banned":
                break;
            case "unbanned":
                break;
        }
    },
    onRoomEvent: function(event){
        switch(event.type){
            case "resource":
                break;
            case "message":
                var p = document.createElement("p");
                if(peer.socket.id == event.client.id)
                    p.innerText = "You: " + event.data;
                else
                    p.innerText = "Other: " + event.data;
                document.querySelector("#chat-messages").appendChild(p);
                    
                break;
            case "joined":
                break;
            case "left":
                break;
            case "kicked":
                break;
            case "banned":
                break;
            case "unbanned":
                break;
        }
    }
});
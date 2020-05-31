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
    // onRemoteStreamStart: function(callId, stream){
    //     var video = document.createElement("video");
    //     video.autoplay = "true";
    //     video.srcObject = stream;
    //     video.id = "remote" + callId;
    //     document.querySelector('#videos').appendChild(video);
    // },
    // onRemoteStreamClose: function(callId){
    //     var id = "remote" + callId;
    //     var video = document.querySelector("#" + id);
    //     document.querySelector('#videos').removeChild(video);
    // },

    eventsHandler: function(e){
        switch(e.type){
            // Errors
            case "error_message_noroom":
                break;
            case "error_create_alreadyinaroom":
                break;
            case "error_join_alreadyinaroom":
                break;
            case "error_leave_noroom":
                break;
            case "error_kick_notallowed":
                break;
            case "error_ban_notallowed":
                break;
            case "error_unban_notallowed":
                break;
            case "error_media_nopermission":
                break;
            case "error_webrtc_nosupport":
                alert("Your browser does not support WebRTC");
                break;
            case "error_toggle_nocamera":
                break;
            case "error_toggle_nomicrophone":
                break;

            // Local
            case "local_ready":
                console.log("Connected to signaling server");
                break;
            case "local_media":
                document.querySelector('video#local').srcObject = e.stream;
                break;
            case "local_created":
                var url = "https://webrtc.sowecms.com/client/autojoin.html#" + event.room.id + ":" + document.querySelector('#createRoomPassword').value;
                document.querySelector("#roomid").innerHTML = "<a href='" + url +"'>" + url + "</a>";
                break;
            case "local_joined":
                break;
            case "local_left":
                break;
            case "local_kicked":
                break;
            case "local_banned":
                break;
            case "local_unbanned":
                break;
            case "local_toggle":
                switch(e.resource){
                    case "camera":
                        document.querySelector("#toggleCam").innerText =
                            (e.status) ? "Disable Cam" : "Enable Cam";
                        break;
                    case "microhpone":
                        document.querySelector("#toggleMicrophone").innerText =
                            (e.status) ? "Disable Microphone" : "Enable Microphone";
                        break;
                    case "audio":
                        e.status = !document.querySelector('video#remote').muted;
                        document.querySelector('video#remote').muted = e.status 
                        document.querySelector("#toggleAudio").innerText =
                            (e.status) ? "Disable Sound" : "Enable Sound";
                        break;
                    default:
                        break;
                }
                break;

            // Remote
            case "remote_message":
                var p = document.createElement("p");
                p.innerHTML = "<strong>" + e.user.name + "</strong>: " + sanitize(e.message);
                document.querySelector("#chat-messages").appendChild(p);
                break;
            case "remote_joined":
                break;
            case "remote_left":
                break;
            case "remote_kicked":
                break;
            case "remote_banned":
                break;
            case "remote_unbanned":
                break;
            case "remote_toggle":
                break;
        }
    },
});

// https://stackoverflow.com/a/48226843
function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, function(){
        return map[match];
    });
}
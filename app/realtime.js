//Socket configuration and realtime code
//Socket - authorization code to get currentUser in session
var addToOnlineList = require('../app/online').addToOnlineList;
var removeFromOnlineList = require('../app/online').removeFromOnlineList;
var addToRoom = require('../app/online').addToRoom;
var leaveFromRoom = require('../app/online').leaveFromRoom;
var addComment = require('../app/online').addComment;
var editComment = require('../app/online').editComment;
var deleteComment = require('../app/online').deleteComment;
var addChat = require('../app/online').addChat;
var deleteChat = require('../app/online').deleteChat;
module.exports = function(app, passport, io){
    io.on('connection', function(socket){
        var session = socket.request.session;
        if(session && session.passport) {
            var currentUser = session.passport.user;
        }
        var currentDiscussion;
        if(currentUser != null){
            addToOnlineList(currentUser, socket.id);
            socket.on('disconnect', function(){
                removeFromOnlineList(currentUser, socket.id);
                if(currentDiscussion){
                    leaveFromRoom(currentUser, currentDiscussion, socket);
                }
            });
        }
        socket.on('socketInDiscussion', function(inDiscussion, discussionId){
            if(inDiscussion){
                currentDiscussion = discussionId;
                //Add currentUser to currentDiscussion room
                addToRoom(currentUser, currentDiscussion, socket, io);
            } else {
                leaveFromRoom(currentUser, currentDiscussion, socket);
            }
        });
        //Add comment
        socket.on('add_comment_toServer', function(data){
            addComment(currentDiscussion, data.comment, socket);
        });
        //Edit comment
        socket.on('edit_comment_toServer', function(data){
            editComment(currentDiscussion, data.commentId, data.comment, socket);
        });
        //Delete comment
        socket.on('delete_comment_toServer', function(data){
            deleteComment(currentDiscussion, data.commentId, data.createdAt, socket);
        });
        //Add chat
        socket.on('add_chat_toServer', function(data){
            addChat(data.chat, data.messageId, data.userId, socket);
        });
        //Delete chat
        socket.on('delete_chat_toServer', function(data){
            deleteChat(data.messageId, data.userId, socket);
        });
    });
};

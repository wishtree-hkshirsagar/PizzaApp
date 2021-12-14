//Functions to maintain online user list and update in realtime
var socketOfUsers = {}; //Key value pair user_id -> [socket_id]
var usersOfSockets = {}; //Key value pair socket_id -> user_id
var usersOfRoom = {}; //Key value pair of discussion_id -> [{user_id, count}]
//Models
var User = require('../app/models/user').User;
//Add socket for the current user
//If current user opens multiple tabs, then a particular user has multiple socket id
function addToOnlineList(currentUser, socket_id){
    usersOfSockets[socket_id] = currentUser;
    //Add socket_id for currentUser
    if(socketOfUsers.hasOwnProperty(currentUser)){
        if(socketOfUsers[currentUser].indexOf(socket_id) == -1){
            socketOfUsers[currentUser].push(socket_id);
        }
    } else {
        //Create a new array of socket_id for currentUser
        socketOfUsers[currentUser] = new Array(socket_id);
    }
}
//Remove socket for current user
function removeFromOnlineList(currentUser, socket_id){
    delete usersOfSockets[socket_id];
    //Splice socket_id from currentUser's list of socket_id's
    if(socketOfUsers.hasOwnProperty(currentUser)){
        socketOfUsers[currentUser].splice(socketOfUsers[currentUser].indexOf(socket_id), 1);
        //If this is the last socket_id then delete socketOfUsers
        if(socketOfUsers[currentUser].length == 0){
            delete socketOfUsers[currentUser];
        }
    }
}
//Add currentUser to discussion's room
function addToRoom(currentUser, currentDiscussion, socket, io){
    socket.join(currentDiscussion, function(data){
        if(usersOfRoom.hasOwnProperty(currentDiscussion)){
            //Add currentUser to usersOfRoom
            if(usersOfRoom[currentDiscussion].hasOwnProperty(currentUser)){
                usersOfRoom[currentDiscussion][currentUser] += 1;
            } else {
                usersOfRoom[currentDiscussion][currentUser] = 1;
            }
        } else {
            usersOfRoom[currentDiscussion] = {};
            usersOfRoom[currentDiscussion][currentUser] = 1;
        }
    });
}
//Remove user from discussion's room
function leaveFromRoom(currentUser, currentDiscussion, socket){
    socket.leave(currentDiscussion, function(data){
        //Remove user from usersOfRoom
        if(usersOfRoom.hasOwnProperty(currentDiscussion)){
            var count = usersOfRoom[currentDiscussion][currentUser];
            if(count > 1){
                usersOfRoom[currentDiscussion][currentUser] -= 1;
            } else if(count == 1) {
                 delete usersOfRoom[currentDiscussion][currentUser];
            }
            if(Object.keys(usersOfRoom[currentDiscussion]).length == 0){
                delete usersOfRoom[currentDiscussion];
            }
        }
    });
}
//Add comment
function addComment(currentDiscussion, comment, socket){
    socket.to(currentDiscussion).emit('add_comment_toClient', { discussionId: currentDiscussion, comment: comment});
}
//Edit comment
function editComment(currentDiscussion, commentId, comment, socket){
    socket.to(currentDiscussion).emit('edit_comment_toClient', { discussionId: currentDiscussion, commentId: commentId, comment: comment});
}
//Delete comment
function deleteComment(currentDiscussion, commentId, createdAt, socket){
    socket.to(currentDiscussion).emit('delete_comment_toClient', { discussionId: currentDiscussion, commentId: commentId, createdAt: createdAt});
}
//Add chat
function addChat(chat, messageId, userId, socket){
    var socketId = socketOfUsers[userId];
    socket.to(socketId).emit('add_chat_toClient', {chat: chat, messageId: messageId, userId: userId});
}
//Delete chat
function deleteChat(messageId, userId, socket){
    var socketId = socketOfUsers[userId];
    socket.to(socketId).emit('delete_chat_toClient', {messageId: messageId, userId: userId});
}
//Export all online functions
module.exports.addToOnlineList = addToOnlineList;
module.exports.removeFromOnlineList = removeFromOnlineList;
module.exports.addToRoom = addToRoom;
module.exports.leaveFromRoom = leaveFromRoom;
module.exports.addComment = addComment;
module.exports.editComment = editComment;
module.exports.deleteComment = deleteComment;
module.exports.addChat = addChat;
module.exports.deleteChat = deleteChat;

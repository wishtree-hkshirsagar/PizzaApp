
//Check if the user passed is current user
Handlebars.registerHelper('isCurrentUser', function(userId, options){
    var currentUser = $('.pageWrap').data('user');
    if(currentUser == userId){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//Check if the user passed is not current user
Handlebars.registerHelper('isNotCurrentUser', function(userId, options){
    if(!userId) return options.inverse(this);
    var currentUser = $('.pageWrap').data('user');
    if(currentUser != userId){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//Check if current user is in the array
Handlebars.registerHelper('hasCurrentUser', function(arr, options){
    var currentUser = $('.pageWrap').data('user');
    if(arr.indexOf(currentUser) > -1){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

//Handlebars get file size
Handlebars.registerHelper('getFileSize', function(bytes){
    if(bytes == 0) return '0 Bytes';
    var k = 1000,
        dm = 1,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    var string = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    return new Handlebars.SafeString(string);
});
//Get first character
Handlebars.registerHelper('getFirstChar', function(string){
    if(string) var string = string.charAt(0).toUpperCase();
    return new Handlebars.SafeString(string);
});
//Handlebars get first name
Handlebars.registerHelper('getFirstName', function(string){
    if(string) var string = string.split(' ')[0];
    return new Handlebars.SafeString(string);
});
//Handlebars has user selected option
Handlebars.registerHelper('hasUserSelectedOption', function(arr, options){
    var currentUser = $('.pageWrap').data('user');
    if(arr.indexOf(currentUser) > -1){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//Handlebars get sizeX
Handlebars.registerHelper('getSizeX', function(multiplier, base){
    if(!multiplier){
        var size = base;
    } else {
        var size = parseInt(multiplier * base);
    }
    return new Handlebars.SafeString(size);
});
//Handlebars get blank fills
Handlebars.registerHelper('getBlankFills', function(fills){
    if (!_.isArray(fills)){ return []; }
    var arr = fills.filter(function (el) {
        return el.is_blank == true;
    });
    return arr;
});
//Get user fill
Handlebars.registerHelper('getUserFill', function(arr){
    var currentUser = $('.pageWrap').data('user');
    var text = '';
    for(var i=0; i<arr.length; i++){
        if(arr[i].creator == currentUser){
            text = arr[i].text;
            break;
        }
    }
    return new Handlebars.SafeString(text);
});
//Handlebars filter match the following options
Handlebars.registerHelper('getMatchOptions', function(options, is_optionb){
    if (!_.isArray(options)){ return []; }
    if(is_optionb){
        var arr = options.filter(function (el) {
            return el.is_optionb == true;
        });
    } else {
        var arr = options.filter(function (el) {
            return el.is_optionb == false;
        });
    }
    return arr;
});
//Handlebars get match colors
Handlebars.registerHelper('getMatchColors', function(options, matchers){
    //Get color dictionary
    var dict = {};
    options.forEach(function(x){
        dict[x._id] = x.color;
    });
    //Get color and matched_to
    var currentUser = $('.pageWrap').data('user');
    var arr = [];
    for(var i=0; i<matchers.length; i++){
        if(matchers[i].creator == currentUser){
            arr.push({matched_to: matchers[i].matched_to, color: dict[matchers[i].matched_to]});
        }
    }
    return arr;
});
//Handlebars get match array
Handlebars.registerHelper('getMatchArr', function(options){
    //Get text dictionary
    var dict = {};
    options.forEach(function(x){
        if(!x.is_optionb){
            dict[x._id] = x.text;
        }
    });
    //Arr
    var arr = [];
    for(var i=0; i<options.length; i++){
        if(options[i].is_optionb){
            if(options[i].matchers && options[i].matchers.length){
                for(var j=0; j<options[i].matchers.length; j++){
                    var matched_to_id = options[i].matchers[j].matched_to;
                    var matched_to = dict[options[i].matchers[j].matched_to];
                    var user_id = options[i].matchers[j].creator._id;
                    var name = options[i].matchers[j].creator.name;
                    arr.push([matched_to_id, matched_to, user_id, name, options[i].text]);
                }
            }
        }
    }
    //User dictionary
    var userDict = {};
    options.forEach(function(x){
        if(!x.is_optionb){
            userDict[x._id] = arr.filter(function(el){
                return el[0] == x._id;
            });
        }
    });
    //Merge arrays
    var finalArr = [];
    for(var key in userDict){
        var optionArr = [];
        var newDict = {};
        var arr =  userDict[key];
        for (var i=0; i<arr.length; i++){
            if(newDict[arr[i][2]] > -1){
                var elem = optionArr[newDict[arr[i][2]]];
                var new_elem = elem[4] + ', ' + arr[i][4];
                elem[4] = new_elem;
            } else {
                optionArr.push(arr[i]);
                newDict[arr[i][2]] = optionArr.length - 1;
            }
        }
        finalArr.push(optionArr);
    }
    return finalArr;
});
//Check if user has editing rights
Handlebars.registerHelper('hasEditingRights', function(creator, members, options){
    var currentUser = $('.pageWrap').data('user');
    if(creator == currentUser){
        return options.fn(this);
    } else if(members && members.length){
        for(var i=0; i<members.length; i++){
            if(members[i].user && members[i].user._id && members[i].user._id == currentUser && members[i].permit_val == 'moderator'){
                return options.fn(this);
            } else if(members[i].user == currentUser && members[i].permit_val == 'moderator'){
                return options.fn(this);
            }
        }
        return options.inverse(this);
    } else {
        return options.inverse(this);
    }
});
//Check if user is invited
Handlebars.registerHelper('isInvited', function(members, options){
    var currentUser = $('.pageWrap').data('user');
    if(members && members.length){
        for(var i=0; i<members.length; i++){
            if(members[i].user && members[i].user._id && members[i].user._id == currentUser){
                return options.fn(this);
            }
        }
        return options.inverse(this);
    } else {
        return options.inverse(this);
    }
});
//Check if user has course editing rights
Handlebars.registerHelper('hasCourseEditingRights', function(options){
    if($('.js-add-block').length){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//Check if can show response
Handlebars.registerHelper('canShowResponse', function(type, options){
    var arr = ['mcq', 'fill', 'match', 'response', 'grid', 'list'];
    if(arr.indexOf(type) > -1){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//Get total responses count
Handlebars.registerHelper('getTotalResponses', function(type, arr){
    var totalResponses = 0;
    var userArr = [];
    if(type == 'mcq'){
        for(var i=0; i<arr.length; i++){
            if(arr[i].voters && arr[i].voters.length){
                for(var j=0; j<arr[i].voters.length; j++){
                    if(userArr.indexOf(arr[i].voters[j].username) < 0){
                        userArr.push(arr[i].voters[j].username);
                    }
                }
            }
        }
    } else if(type == 'fill'){
        for(var i=0; i<arr.length; i++){
            if(arr[i].responses && arr[i].responses.length){
                for(var j=0; j<arr[i].responses.length; j++){
                    if(userArr.indexOf(arr[i].responses[j].creator.username) < 0){
                        userArr.push(arr[i].responses[j].creator.username);
                    }
                }
            }
        }
    } else if(type == 'match'){
        for(var i=0; i<arr.length; i++){
            if(arr[i].matchers && arr[i].matchers.length){
                for(var j=0; j<arr[i].matchers.length; j++){
                    if(userArr.indexOf(arr[i].matchers[j].creator.username) < 0){
                        userArr.push(arr[i].matchers[j].creator.username);
                    }
                }
            }
        }
    }
    totalResponses = userArr.length;
    userArr = [];
    return totalResponses;
});
//Check if can show ifttt
Handlebars.registerHelper('canShowIfttt', function(type, options){
    var arr = ['mcq', 'fill'];
    if(arr.indexOf(type) > -1){
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//Get percentage
Handlebars.registerHelper('getPercentage', function(x, y){
    var percentage = parseInt(x/y*100);
    return percentage;
});
//Get total views
Handlebars.registerHelper('getTotalViews', function(viewers){
    var views = 0;
    if(viewers && viewers.length){
        for(var i=0; i<viewers.length; i++){
            views += viewers[i].count;
        }
    }
    return views;
});
//Get comments count
Handlebars.registerHelper('getCommentsCount', function(blocks){
    var comments = 0;
    if(blocks && blocks.length){
        for(var i=0; i<blocks.length; i++){
            comments += blocks[i].comments.length;
        }
    }
    return comments;
});

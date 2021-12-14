//Global functions
//Convert to CSV
function convertToCSV(objArray){
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','
            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
}
//Export CSV file
function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }
    //Convert Object to JSON
    var jsonObject = JSON.stringify(items);
    var csv = this.convertToCSV(jsonObject);
    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { //IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { //feature detection
            //Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}
//Slugify string
function stringToSlug(str){
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();
    // remove accents, swap ñ for n, etc
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    str = str.replace(/[^a-z0-9 -]/g, '') //remove invalid chars
        .replace(/\s+/g, '-') //collapse whitespace and replace by -
        .replace(/-+/g, '-'); //collapse dashes
    return str;
}
//HTML to text
function htmlToPlainText(html){
    var temp = document.createElement("div");
    temp.innerHTML = html;
    var text = temp.textContent || temp.innerText;
    if(text){
        text = text.replace(/,/g, '');
        return text;
    } else {
        return "";
    }
}
//Format date
function formatDateInDDMMYYYY(date){
    var formattedDate = date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
    return formattedDate;
}
//Function to group comments by date
function groupCommentsByDate(comments){
    var dateToday = new Date();
    var today = formatDateInDDMMYYYY(dateToday);
    //Yesterday
    dateToday.setDate(dateToday.getDate() - 1);
    var yesterday = formatDateInDDMMYYYY(dateToday);
    //Dates collection
    var dates = new Backbone.Collection();
    var dateArray = [];
    comments.each(function(comment){
        //Get comment object
        var commentObj = {
            _id: comment.get('_id'),
            text: comment.get('text'),
            summary: comment.get('summary'),
            image: comment.get('image'),
            bound: comment.get('bound'),
            images: comment.get('images'),
            attachment: comment.get('attachment'),
            likes: comment.get('likes'),
            is_recent: comment.get('is_recent'),
            reply_to: comment.get('reply_to'),
            creator: comment.get('creator'),
            created_at: comment.get('created_at'),
            updated_at: comment.get('updated_at')
        };
        //Update time to local
        var comment_date = formatDateInDDMMYYYY(new Date(comment.get('created_at')));
        if(dateArray.indexOf(comment_date) > -1){
            //Get date model
            if(comment_date == today){
                var dateModel = dates.findWhere({date: 'Today'});
            } else if(comment_date == yesterday){
                var dateModel = dates.findWhere({date: 'Yesterday'});
            } else {
                var dateModel = dates.findWhere({date: comment_date});
            }
            //Add comment
            dateModel.get('comments').push(commentObj);
        } else {
            //Push to dateArray
            dateArray.push(comment_date);
            //Create date model
            var dateModel = new Backbone.Model();
            //Set date
            if(comment_date == today){
                dateModel.set('date', 'Today');
            } else if(comment_date == yesterday){
                dateModel.set('date', 'Yesterday');
            } else {
                dateModel.set('date', comment_date);
            }
            //Set comments
            dateModel.set('comments', [commentObj]);
            //Add to dates collection
            dates.push(dateModel);
        }
    });
    return dates;
}

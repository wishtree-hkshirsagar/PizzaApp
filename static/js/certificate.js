$(function() {
    //Show current date
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    }
    if(mm<10){
        mm='0'+mm;
    }
    $('.contentWrap .date').text(dd+'/'+mm+'/'+yyyy);
    //Print
    setTimeout(function(){
        $('.certificateWrap').printThis();
    }, 1000);
});

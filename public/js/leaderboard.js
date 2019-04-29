window.userData = {};
db.collection("users").orderBy("points").get().then(function (querySnapshot) {
    var num = 0;
    querySnapshot.forEach(function (doc) {
        num++;
        var data = doc.data();
        window.userData[doc.id] = data.completed;
        $("#leaders").append('<li id="' + doc.id + '"><div class="heading"><span class="number">#' + num + '</span><span class="name">' + data.firstName + ' ' + data.lastName + '</span><span class="points">'+data.points+'pts</span></div><div class="addition"><h1>Completed Challenges:</h1><ul class="completed"></ul></div></li><li>');
    });
});
$(document).on("click", "#leaders > li", function () {
    var addition = $(this).find(".addition");
    var completed = addition.find(".completed");
    if(addition.is(":visible")) {
        addition.slideUp();
        return;
    }
    if(completed.html() !== "") {
        addition.slideDown();
        return;
    }
    for(exercise in window.userData[this.id]) {
        db.collection("exercise").doc(window.userData[this.id][exercise]).get().then(function (doc) {
            completed.append("<li>"+doc.data().title+"</li>");
        });
    }
    addition.slideDown();
});
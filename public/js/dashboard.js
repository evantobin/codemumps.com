db.collection("exercise").get().then(function (querySnapshot) {
  querySnapshot.forEach(function (doc) {
    var data = doc.data();
    $("#exercises").append('<li class="available"><a href="exercise.html?id=' + doc.id + '"><h1>' + data.title + '</h1><em>' + data.points + 'pts, ' + DifficultyEnum.properties[data.difficulty].name + '</em><p>' + data.summary + '</p></a></li>');
  });
});
var DifficultyEnum = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  properties: {
    1: { name: "Easy", value: 1 },
    2: { name: "Medium", value: 2 },
    3: { name: "Hard", value: 3 }
  }
};


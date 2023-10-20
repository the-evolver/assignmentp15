let positions = [];
let tiles = [];
let time = 0;
let moves = 0;
let counter = null;
let paused = true;
let won = false;

document.addEventListener("DOMContentLoaded", function () {
  loadGameState();
  // function to fetch and display leaderboard data
  fetchLeaderboardData();

  if (!paused) {
    startGame(); // Resume the game if it was not paused
  }
});

$(document).on("click", ".tile", function () {
  if (!paused) {
    let num = $(this).attr("num");
    let tile = getTile(num);
    tile.move();
  }
});

$(document).on("click", "#start-button", function () {
  if (!$(this).hasClass("disabled")) {
    if (paused) {
      startGame();
    } else {
      pauseGame();
    }
  }
});

$(document).on("click", "#reset-button", function () {
  if (!$(this).hasClass("disabled")) {
    resetGame();
  }
});

$(document).on("click", "#overlay-play", function () {
  if (!$("#start-button").hasClass("disabled")) {
    startGame();
  }
});

$(document).on("click", "#overlay-paused", function () {
  startGame();
});

function startGame() {
  paused = false;
  $("#start-button").html("PAUSE");
  $("#overlay").fadeOut("fast");
  $("#overlay-play").hide();
  $("#overlay-message").hide();
  $("#overlay-submessage").hide();
  $(this).css("opacity", "1");
  if (tiles.length == 0) {
    resetContents();
  }
  counter = setInterval(function () {
    time++;
    displayCurrentTime();
  }, 1000);
}

function pauseGame() {
  paused = true;
  $("#start-button").html("START");
  $("#overlay-paused").show();
  $("#overlay").fadeIn("fast"); // ..fast is -> one of the predefined speed strings in jQuery
  clearInterval(counter);
}

function resetGame() {
  pauseGame();
  resetContents();
  $("#overlay-paused").hide();
  $("#overlay-play").show();
  $("#overlay-message").hide();
  $("#overlay-submessage").hide();
}

function resetContents() {
  $(".tile").removeClass("correct");
  tiles = [];
  positions = loadPositions();
  generateTiles(positions);
  time = 0;
  moves = 0;
  $("#score-point .num").html("0");
  $("#timepoint .num").html("00:00");
  won = false;
}

function generateTiles(positions) {
  //console.log(".. elements generate ho rhi ...");
  let position = null;
  let tile = null;
  for (let i = 1; i < 16; i++) {
    position = getRandomFreePosition(positions);
    tile = new Tile(position.x, position.y, i);
    tiles.push(tile);
    tile.insertTile();
    position.free = false;
    position = null;
    tile = null;
  }
}

function addMove(check = true) {
  if (check) moves++; // if not handled then move will be unnecesarily increased..

  $("#score-point .num").html(moves);
  saveGameState(); // Save game state after each move
}

function displayCurrentTime() {
  let minutes = Math.floor(time / 60);
  let seconds = time - minutes * 60;
  $("#timepoint .num").html(convert(minutes) + ":" + convert(seconds));
  saveGameState(); // Save game state after updating time
}

function convert(n) {
  return n > 9 ? "" + n : "0" + n; // because 00 format
}

function win() {
  pauseGame();
  $("#overlay-paused").hide();
  $("#overlay-inner").show();
  $("#overlay-inner #overlay-message").html("YOU WIN!").show();
  let finalTime = $("#timepoint .num").html();
  let finalMoves = $("#score-point .num").html();

  $("#overlay-inner #overlay-submessage")
    .html(
      "<b>Time</b>: " + finalTime + "&nbsp&nbsp&nbsp<b>Moves</b>: " + finalMoves
    )
    .show();

  tiles = [];
  won = true;
  saveGameResults();
}

// Function to save the game state
function saveGameState() {
  const gameState = {
    positions: positions,
    paused: paused,
    time: time,
    moves: moves,
    tiles: tiles.map((tile) => {
      return {
        x: tile.x,
        y: tile.y,
        num: tile.num,
        offset: tile.offset,
        current: tile.current,
        correctPosition: tile.correctPosition,
      };
    }),
  };
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
  const savedState = localStorage.getItem("gameState");
  if (savedState) {
    const gameState = JSON.parse(savedState);

    positions = gameState.positions;
    time = gameState.time;
    moves = gameState.moves;

    // reecreateing the tiles based on saved state
    tiles = gameState.tiles.map((tileData) => {
      const tile = new Tile(tileData.x, tileData.y, tileData.num);
      tile.offset = tileData.offset;
      tile.current = tileData.current;
      tile.correctPosition = tileData.correctPosition;

      tile.insertTile();

      if (tile.num == tile.current) {
        tile.markAsCorrect();
      }

      return tile;
    });

    displayCurrentTime();
    $("#score-point .num").html(moves);

    if (!paused) {
      counter = setInterval(function () {
        time++;
        displayCurrentTime();
      }, 1000);
    }
  }
}

function saveGameResults() {
  if (won) {
    const finalTime = $("#timepoint .num").html();
    const finalMoves = moves;

    const leaderboardData = {
      userId: ` user-${Math.floor(
        Math.random() * 1000 + Math.random() * 100 + Math.random() * 10
      )}`,
      time: finalTime,
      moves: finalMoves,
    };

    fetch("http://localhost:3000/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leaderboardData),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }
}

function fetchLeaderboardData() {
  fetch("http://localhost:3000/leaderboard")
    .then((response) => response.json())
    .then((data) => {
      // get the leaderboard table body
      const leaderboardTableBody = document.querySelector(
        "#leaderboard-table tbody"
      );

      leaderboardTableBody.innerHTML = "";

      // Looping leaderboard data to add rows...
      data.forEach((entry, index) => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
          <td>${entry.userId}</td>
          <td>${entry.time}</td>
          <td>${entry.moves}</td>
        `;
        leaderboardTableBody.appendChild(newRow);
      });
    })
    .catch((error) => {
      console.error("Error fetching leaderboard data:", error);
    });
}

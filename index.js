const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";
let totalPairs = 0;
let matchedPairs = 0;
let clickCount = 0;
let timeLeft = 60;
let timerInterval = null;

function resetStats() {
  clickCount = 0;
  matchedPairs = 0;
  $("#click_count").text(`Clicks: ${clickCount}`);
  $("#pairs_matched").text(`Matched: 0`);
  $("#pairs_remaining").text(`Remaining: ${totalPairs}`);
  console.log("Stats reset.");
}


function startTimer() {
  clearInterval(timerInterval); // Clear any old timer
  $("#timer").text(`Time: ${timeLeft}s`);

  timerInterval = setInterval(() => {
    timeLeft--;
    $("#timer").text(`Time: ${timeLeft}s`);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      console.log("Timer expired — player lost the game.");
      $(".card").off("click");

      // Show loss modal
      const loseModal = new bootstrap.Modal(document.getElementById("loseModal"));
      loseModal.show();

      // After modal closes, reset game UI
      const modalElement = document.getElementById("loseModal");
      modalElement.addEventListener("hidden.bs.modal", function onClose() {
        console.log("Loss modal closed — resetting game state.");
        resetUIAfterGameEnd();
        modalElement.removeEventListener("hidden.bs.modal", onClose);
      });
    }

  }, 1000);
}


async function fetchRandomPokemon(limit = 3) {
  const maxId = 1025; // safest range to avoid gaps
  const ids = new Set();

  while (ids.size < limit) {
    ids.add(Math.floor(Math.random() * maxId) + 1);
  }

  const promises = [...ids].map(id =>
    fetch(`${POKE_API_BASE}/${id}`)
      .then(res => res.json())
      .then(data => ({
        name: data.name,
        id: data.id,
        image: data.sprites.other["official-artwork"].front_default
      }))
  );

  return Promise.all(promises);
}


function setup() {
  let firstCard = undefined;
  let secondCard = undefined;

  $(".card").on("click", function () {
    // Edge case: Already flipping 2 cards
    if (firstCard && secondCard) return;

    //  Edge case: This card is already flipped
    if ($(this).hasClass("flip")) return;

    $(this).toggleClass("flip");
    clickCount++;
    $("#click_count").text(`Clicks: ${clickCount}`);
    console.log(`Click count updated: ${clickCount}`);


    if (!firstCard) {
      firstCard = $(this).find(".front_face")[0];
    } else {
      secondCard = $(this).find(".front_face")[0];
      console.log(firstCard, secondCard);

      if (firstCard.src == secondCard.src) {
        console.log("match");
        $(`#${firstCard.id}`).parent().off("click");
        $(`#${secondCard.id}`).parent().off("click");
        matchedPairs++;
        const remaining = totalPairs - matchedPairs;
        $("#pairs_matched").text(`Matched: ${matchedPairs}`);
        $("#pairs_remaining").text(`Remaining: ${remaining}`);
        console.log(`Pair matched! Total matched: ${matchedPairs}, Remaining: ${remaining}`);


        //  WIN CHECK: If all cards are flipped, player has won
        if ($(".card").length === $(".flip").length) {
          showWinMessage(); // you'll define this elsewhere
        }

      } else {
        console.log("no match");
        setTimeout(() => {
          $(`#${firstCard.id}`).parent().toggleClass("flip");
          $(`#${secondCard.id}`).parent().toggleClass("flip");
        }, 1000);
      }

      setTimeout(() => {
        firstCard = undefined;
        secondCard = undefined;
      }, 1000);
    }
  });
}


function renderCards(pokemonList) {
  const gameGrid = $("#game_grid");
  gameGrid.empty(); // Clear any existing cards
  // Set grid layout dynamically
  if (totalPairs === 3) {
    gameGrid.css("grid-template-columns", "repeat(3, 1fr)"); // 2 rows x 3 cols
  } else if (totalPairs === 6) {
    gameGrid.css("grid-template-columns", "repeat(4, 1fr)"); // 3 rows x 4 cols
  } else if (totalPairs === 8) {
    gameGrid.css("grid-template-columns", "repeat(4, 1fr)"); // 4 rows x 4 cols
  }


  // Duplicate each Pokémon (so each appears twice)
  const allCards = [...pokemonList, ...pokemonList];

  // Shuffle the cards
  allCards.sort(() => Math.random() - 0.5);

  // Create and append each card
  allCards.forEach((pokemon, index) => {
    const card = $(`
      <div class="card">
        <img id="img${index}" class="front_face" src="${pokemon.image}" alt="${pokemon.name}">
        <img class="back_face" src="back.webp" alt="back">
      </div>
    `);
    gameGrid.append(card);
  });
}

async function startGame() {
  console.log("Game started.");

  // Difficulty-based logic
  const difficulty = $("#difficulty_select").val();
  let pairCount = 6;

  if (difficulty === "easy") pairCount = 3;
  else if (difficulty === "medium") pairCount = 6;
  else if (difficulty === "hard") pairCount = 8;

  console.log(`Difficulty: ${difficulty}, Pairs: ${pairCount}, Time: ${timeLeft}s`);

  totalPairs = pairCount;
  timeLeft = difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 90;

  const pokemonList = await fetchRandomPokemon(pairCount);
  renderCards(pokemonList);
  setup(); // enables flip/click logic
  resetStats();
  startTimer();

  // UI Controls
  $("#start_btn").hide();
  $("#restart_btn").prop("disabled", false);
  $("#difficulty_select").prop("disabled", true);
}

async function restartGame() {
  console.log("Game restarted by user.");

  const difficulty = $("#difficulty_select").val();
  let pairCount = 6;

  if (difficulty === "easy") pairCount = 3;
  else if (difficulty === "medium") pairCount = 6;
  else if (difficulty === "hard") pairCount = 8;

  console.log(`Difficulty: ${difficulty}, Pairs: ${pairCount}, Time: ${timeLeft}s`);

  totalPairs = pairCount;
  timeLeft = difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 90;

  const pokemonList = await fetchRandomPokemon(pairCount);
  renderCards(pokemonList);
  setup();
  resetStats();
  startTimer();

  // UI stays locked mid-game
  $("#start_btn").hide();
  $("#restart_btn").prop("disabled", false);
  $("#difficulty_select").prop("disabled", true);
}


function showWinMessage() {
  clearInterval(timerInterval);
  console.log("Player matched all pairs — showing win modal.");

  // Show Bootstrap modal
  const winModal = new bootstrap.Modal(document.getElementById("winModal"));
  winModal.show();

  // Disable further clicking
  $(".card").off("click");

  // After modal is closed, reset UI and grid
  const modalElement = document.getElementById("winModal");
  modalElement.addEventListener("hidden.bs.modal", function onClose() {
    console.log("Win modal closed — resetting game state.");
    resetUIAfterGameEnd();
    modalElement.removeEventListener("hidden.bs.modal", onClose);
  });

}

function resetUIAfterGameEnd() {
  $("#game_grid").empty(); // Clear cards
  $("#start_btn").show(); // Bring back Start
  $("#restart_btn").prop("disabled", true); // Disable Restart
  $("#difficulty_select").prop("disabled", false); // Re-enable difficulty

  // Reset stat display
  $("#click_count").text("Clicks: 0");
  $("#pairs_matched").text("Matched: 0");
  $("#pairs_remaining").text("Remaining: 0");

  console.log("Game reset: UI and grid cleared.");
}

$(document).ready(function () {
  $("#start_btn").on("click", startGame);
  $("#restart_btn").on("click", restartGame);
});




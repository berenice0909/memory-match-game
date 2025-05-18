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
  const maxId = 1025;
  const selectedPokemon = [];
  const usedIds = new Set();

  while (selectedPokemon.length < limit) {
    const id = Math.floor(Math.random() * maxId) + 1;
    if (usedIds.has(id)) continue;

    try {
      const res = await fetch(`${POKE_API_BASE}/${id}`);
      const data = await res.json();
      const image = data.sprites.other["official-artwork"].front_default;

      if (image) {
        // Preload image
        const img = new Image();
        img.src = image;

        // Wait for it to load
        await new Promise(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // proceed even if image fails
        });

        selectedPokemon.push({
          name: data.name,
          id: data.id,
          image: image
        });

        console.log(`[Fetch] Accepted Pokémon: ${data.name} (ID ${id})`);

        console.log(`[Fetch] Accepted Pokémon: ${data.name} (ID ${id})`);
      } else {
        console.log(`[Fetch] Skipped Pokémon (no image): ID ${id}`);
      }

      usedIds.add(id);

      // Add delay before next request (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`[Fetch] Error fetching Pokémon ID ${id}:`, error);
    }
  }

  return selectedPokemon;
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
$("#loading_alert").show();

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
  $("#loading_alert").hide();

  setup(); // enables flip/click logic
  resetStats();
  startTimer();

  // UI Controls
  $("#start_btn").hide();
  $("#restart_btn").prop("disabled", false);
  $("#difficulty_select").prop("disabled", true);
  $("#powerup_btn").show().prop("disabled", false);
  console.log("[Power-Up] Button shown and enabled on game start.");

}

async function restartGame() {
  console.log("Game restarted by user.");
$("#loading_alert").show();

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
  $("#loading_alert").hide();

  setup();
  resetStats();
  startTimer();

  // UI stays locked mid-game
  $("#start_btn").hide();
  $("#restart_btn").prop("disabled", false);
  $("#difficulty_select").prop("disabled", true);
  $("#powerup_btn").show().prop("disabled", false);
  console.log("[Power-Up] Button shown and reset on restart.");

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
  $("#powerup_btn").hide().prop("disabled", true);
  console.log("[Power-Up] Button hidden and disabled after game end.");

  console.log("Game reset: UI and grid cleared.");
}

function applyTheme(theme) {
  console.log(`[Theme] Requested theme: ${theme}`);

  if (!theme || (theme !== "light" && theme !== "dark")) {
    console.log("[Theme] Invalid theme provided:", theme);
    return;
  }

  const body = document.body;
  console.log("[Theme] Current body classes:", body.className);

  // Remove previous theme classes
  body.classList.remove("theme-light", "theme-dark");
  console.log("[Theme] Removed previous theme classes.");

  // Add new theme class
  body.classList.add(`theme-${theme}`);
  console.log(`[Theme] Applied class theme-${theme}`);

  // Update visual state in dropdown
  $("#lightThemeBtn, #darkThemeBtn").removeClass("active");
  $(`#${theme}ThemeBtn`).addClass("active");
  console.log(`[Theme] Activated dropdown item: ${theme}ThemeBtn`);
}

$(document).ready(function () {
  console.log("[Init] Applying default theme (light)");
  applyTheme("light");

  $("#start_btn").on("click", startGame);
  $("#restart_btn").on("click", restartGame);

  $("#lightThemeBtn").on("click", function () {
    console.log("[Theme] Light theme button clicked.");
    applyTheme("light");
  });

  $("#darkThemeBtn").on("click", function () {
    console.log("[Theme] Dark theme button clicked.");
    applyTheme("dark");
  });

  $("#powerup_btn").on("click", function () {
    console.log("[Power-Up] Button clicked.");

    // Disable button immediately
    $(this).prop("disabled", true);
    console.log("[Power-Up] Button disabled after use.");

    // Flip all cards
    $(".card").addClass("flip");
    console.log("[Power-Up] All cards flipped face-up.");

    // After 3 seconds, flip back only unmatched cards
    setTimeout(() => {
      $(".card").each(function () {
        const front = $(this).find(".front_face")[0];
        if (front && $(`#${front.id}`).length) {
          // Check if the card is still clickable (not matched)
          if ($(this).data("matched") !== true) {
            $(this).removeClass("flip");
          }
        }
      });
      console.log("[Power-Up] Unmatched cards flipped back down.");
    }, 3000);
  });

});




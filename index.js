const POKE_API_BASE = "https://pokeapi.co/api/v2/pokemon";

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
  let firstCard = undefined
  let secondCard = undefined
$(".card").on("click", function () {
  // Edge case guard: ignore clicks if two cards already selected
  if (firstCard && secondCard) return;

  //Edge case guard: don't allow re-clicking the same card
  if ($(this).hasClass("flip")) return;

  $(this).toggleClass("flip");

  if (!firstCard) {
    firstCard = $(this).find(".front_face")[0];
  } else {
    secondCard = $(this).find(".front_face")[0];
    console.log(firstCard, secondCard);

    if (firstCard.src == secondCard.src) {
      console.log("match");
      $(`#${firstCard.id}`).parent().off("click");
      $(`#${secondCard.id}`).parent().off("click");
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


$(document).ready(async function () {
  const pokemonList = await fetchRandomPokemon(3);
  renderCards(pokemonList);
  setup();
});

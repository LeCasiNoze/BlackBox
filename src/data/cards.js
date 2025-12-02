// src/data/cards.js

const CARDS = [
  { id: "card01", ownerName: "Non assignée", notes: "" },
  { id: "card02", ownerName: "Non assignée", notes: "" },
  { id: "card03", ownerName: "Non assignée", notes: "" },
];

function findCardById(cardId) {
  return CARDS.find((c) => c.id === cardId);
}

function shortId(cardId) {
  const digits = cardId.replace(/\D/g, "");
  return digits || cardId;
}

function assignCard(cardId, ownerName, notes) {
  const card = findCardById(cardId);
  if (!card) return null;
  card.ownerName = ownerName || card.ownerName;
  card.notes = notes || "";
  return card;
}

module.exports = {
  CARDS,
  findCardById,
  shortId,
  assignCard,
};
